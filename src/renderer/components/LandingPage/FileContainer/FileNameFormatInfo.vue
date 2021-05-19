<template>
  <div class="wrapper" v-if="selectedStream">
    <div class="config-wrapper">
      <options-dropdown 
        title="Filename Format" 
        :options="fileNameFormatOptions"
        specialOptionTitle="Custom..."
        :isLoading="isUpdatingFilenameFormat"
        :selectedOptionText="(isCustomTimestampFormat ? 'custom ・ ' : '') + selectedStream.timestampFormat"
        @onSelectOption="onFormatSave"
        @onSelectSpecialOption="openFileNameFormatSettingModal">
      </options-dropdown>
      <options-dropdown 
        title="Filename Timezone" 
        :options="fileNameTimezoneOptions"
        :isLoading="isUpdatingFilenameFormat"
        :selectedOptionText="getTimezoneOptionText(selectedTimezone)"
        @onSelectOption="onTimezoneSave">
      </options-dropdown>
    </div>
    <div>
      <button type="button" class="button is-rounded is-cancel" @click.prevent="confirmToClearAllFiles()" :class="{ 'is-loading': isDeletingAllFiles }">Clear all</button>
      <button type="button" class="button is-rounded is-primary" @click.prevent="queueToUpload()" :disabled="numberOfReadyToUploadFiles < 1 || isDeletingAllFiles">Start upload ({{numberOfReadyToUploadFiles}})</button>
    </div>
    <div class="modal is-active" v-if="showSettingModal">
      <div class="modal-background"></div>
      <file-name-format-settings
        :format="selectedStream.timestampFormat"
        @onClose="closeFileNameFormatSettingModal"
        @save="onFormatSave"/>
      <button class="modal-close is-large" aria-label="close"></button>
    </div>
    <ErrorAlert v-if="errorMessage" :content="errorMessage" @onCancelPressed="errorMessage = null"/>
  </div>
</template>

<script>

import { mapState } from 'vuex'
import FileNameFormatSettings from '../FileNameFormatSettings/FileNameFormatSettings.vue'
import fileFormat from '../../../../../utils/FileFormat'
import FileTimeZoneHelper from '../../../../../utils/FileTimezoneHelper'
import OptionsDropdown from '../../Common/OptionsDropdown'
import ErrorAlert from '../../Common/ErrorAlert'
import ipcRendererSend from '../../../services/ipc'

export default {
  props: {
    numberOfReadyToUploadFiles: {
      type: Number,
      default: () => 0
    },
    selectedStream: Object
  },
  components: { FileNameFormatSettings, ErrorAlert, OptionsDropdown },
  data () {
    return {
      showSettingModal: false,
      isDeletingAllFiles: false,
      isQueuingToUpload: false,
      isUpdatingFilenameFormat: false,
      errorMessage: null,
      selectedTimezone: ''
    }
  },
  computed: {
    ...mapState({
      selectedStreamId: state => state.AppSetting.selectedStreamId
    }),
    fileNameFormatOptions () {
      return Object.values(fileFormat.fileFormat)
    },
    isCustomTimestampFormat () {
      return !this.fileNameFormatOptions.includes(this.selectedStream.timestampFormat)
    },
    fileNameTimezoneOptions () {
      return FileTimeZoneHelper.getTimezoneOptions(this.selectedStream.timezone)
    },
    defaultTimezone () {
      const savedSelectedTimezone = this.$store.getters.getSelectedTimezoneByStreamId(this.selectedStreamId)
      return this.getTimezoneOptionText(savedSelectedTimezone || FileTimeZoneHelper.fileTimezone.UTC)
    }
  },
  created () {
    this.selectedTimezone = this.defaultTimezone
  },
  methods: {
    async queueToUpload () {
      this.isQueuingToUpload = true

      // set session id
      const sessionId = this.$store.state.AppSetting.currentUploadingSessionId || '_' + Math.random().toString(36).substr(2, 9)
      await this.$store.dispatch('setCurrentUploadingSessionId', sessionId)

      // completion listener
      // const t0 = performance.now()
      // let listen = (event, arg) => {
      //   this.$electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.putFilesIntoUploadingQueueResponse, listen)
      //   this.isQueuingToUpload = false
      //   const t1 = performance.now()
      //   console.log('[Measure] putFilesIntoUploadingQueue ' + (t1 - t0) + ' ms')
      // }

      // emit to main process to put file in uploading queue
      // const data = {streamId: this.selectedStreamId, sessionId: sessionId}
      // this.$electron.ipcRenderer.send(DatabaseEventName.eventsName.putFilesIntoUploadingQueueRequest, data)
      // this.$electron.ipcRenderer.on(DatabaseEventName.eventsName.putFilesIntoUploadingQueueResponse, listen)
      const streamId = this.selectedStreamId
      const query = { streamId, state: 'preparing' }
      await ipcRendererSend('db.files.bulkUpdate', `db.files.bulkUpdate.${Date.now()}`, {
        where: query,
        values: { state: 'waiting', stateMessage: null, sessionId, timezone: this.getSelectedTimezoneValue() }
      })
      this.isQueuingToUpload = false

      // set selected tab to be queue tab
      const tabObject = {}
      tabObject[this.selectedStreamId] = 'Queued'
      await this.$store.dispatch('setSelectedTab', tabObject)

      this.$emit('onNeedResetStreamList')

      // always enable uploading process
      await this.$store.dispatch('enableUploadingProcess', true)
    },
    confirmToClearAllFiles () {
      this.clearAllFiles()
    },
    async clearAllFiles () {
      this.isDeletingAllFiles = true
      await ipcRendererSend('db.files.delete', `db.files.delete.${Date.now()}`, {
        where: {
          streamId: this.selectedStreamId,
          state: ['preparing', 'local_error']
        }
      })
      this.$emit('onNeedResetFileList')
      this.$emit('onNeedResetStreamList')
      this.isDeletingAllFiles = false
      // await streamService.updateStreamStats(streamId, [
      //   { name: 'preparingCount', action: '-', diff: files.length },
      //   { name: 'sessionTotalCount', action: '+', diff: files.length }
      // ])
      // const t0 = performance.now()
      // let listen = (event, arg) => {
      //   this.$electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.deletePreparingFilesResponse, listen)
      //   this.isDeletingAllFiles = false
      //   const t1 = performance.now()
      //   console.log('[Measure] delete prepare files ' + (t1 - t0) + ' ms')
      // }
      // this.$electron.ipcRenderer.send(DatabaseEventName.eventsName.deletePreparingFilesRequest, this.selectedStreamId)
      // this.$electron.ipcRenderer.on(DatabaseEventName.eventsName.deletePreparingFilesResponse, listen)
    },
    openFileNameFormatSettingModal () {
      this.showSettingModal = true
    },
    closeFileNameFormatSettingModal () {
      this.showSettingModal = false
    },
    async onFormatSave (format = '') {
      this.closeFileNameFormatSettingModal()
      console.log('onFormatSave', format)
      this.isUpdatingFilenameFormat = true
      this.$file.updateFilesFormat(this.selectedStream, format).then(_ => {
        this.selectedStream.timestampFormat = format
        this.$emit('onNeedResetFileList')
        this.isUpdatingFilenameFormat = false
      }).catch(error => {
        this.isUpdatingFilenameFormat = false
        console.log(`Error update files format '${format}'`, error.message)
        this.errorMessage = error.message
      })
    },
    async onTimezoneSave (timezone) {
      this.selectedTimezone = FileTimeZoneHelper.getSelectedTimezoneOption(timezone)
      const timezoneObject = {}
      timezoneObject[this.selectedStreamId] = this.selectedTimezone
      this.$store.dispatch('setSelectedTimezone', timezoneObject)
    },
    getSelectedTimezoneValue () {
      if (this.selectedTimezone.includes(FileTimeZoneHelper.fileTimezone.LOCAL_TIME)) return this.selectedStream.timezone
      else return ''
    },
    getTimezoneOptionText (optionTitle) {
      if (optionTitle === FileTimeZoneHelper.fileTimezone.LOCAL_TIME) return `${optionTitle} (${this.selectedStream.timezone})`
      else return optionTitle
    }
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    padding: $default-padding;
    display: flex;
    justify-content: space-between;
    align-self: center;
    white-space: nowrap;
    text-overflow: ellipsis;
    &__title {
      font-weight: $title-font-weight;
      color: $secondary-text-color;
      display: block;
    }
    &__description {
      color: $secondary-text-color;
      display: inline-block;
    }
  }
  .config-wrapper {
    display: inline-flex;
    .dropdown-wrapper {
      padding-right: $default-padding;
    }
  }
  .flex-row {
    flex-direction: row;
  }
  .align-center {
    align-items: center;
  }
</style>
