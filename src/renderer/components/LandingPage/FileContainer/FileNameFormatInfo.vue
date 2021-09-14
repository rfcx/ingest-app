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
        @onSelectOption="onTimezoneSave"
        :isFocus="shouldFocusTimezoneInput">
      </options-dropdown>
    </div>
    <div>
      <button type="button" class="button is-rounded is-cancel" @click.prevent="confirmToClearAllFiles()" :class="{ 'is-loading': isDeletingAllFiles }">Clear all</button>
      <button type="button" class="button is-rounded is-primary" @click.prevent="shouldShowConfirmTimezoneAlert = true" :disabled="numberOfReadyToUploadFiles < 1 || isDeletingAllFiles">Start upload ({{numberOfReadyToUploadFiles}})</button>
    </div>
    <div class="modal is-active" v-if="showSettingModal">
      <div class="modal-background"></div>
      <file-name-format-settings
        :format="selectedStream.timestampFormat"
        @onClose="closeFileNameFormatSettingModal"
        @save="onFormatSave"/>
      <button class="modal-close is-large" aria-label="close"></button>
    </div>
    <ConfirmAlert
    v-if="shouldShowConfirmTimezoneAlert"
    :title="confirmTimezoneAlertText.title"
    :contentHTML="confirmTimezoneAlertText.message"  
    :confirmButtonText="confirmTimezoneAlertText.confirmTitle"
    :cancelButtonText="confirmTimezoneAlertText.cancelTitle"
    @onCancelPressed="recheckTimezoneSettings()"
    @onConfirmPressed="queueToUpload()" />
    <ErrorAlert v-if="errorMessage" :content="errorMessage" @onCancelPressed="errorMessage = null"/>
  </div>
</template>

<script>

import { mapState } from 'vuex'
import FileNameFormatSettings from '../FileNameFormatSettings/FileNameFormatSettings.vue'
import fileFormat from '../../../../../utils/FileFormat'
import fileState from '../../../../../utils/fileState'
import FileTimeZoneHelper from '../../../../../utils/FileTimezoneHelper'
import OptionsDropdown from '../../Common/OptionsDropdown'
import ConfirmAlert from '../../Common/ConfirmAlert'
import ErrorAlert from '../../Common/ErrorAlert'
import ipcRendererSend from '../../../services/ipc'

const { PREPARING, WAITING } = fileState.state

export default {
  props: {
    numberOfReadyToUploadFiles: {
      type: Number,
      default: () => 0
    },
    selectedStream: Object
  },
  components: { FileNameFormatSettings, ConfirmAlert, ErrorAlert, OptionsDropdown },
  data () {
    return {
      showSettingModal: false,
      isDeletingAllFiles: false,
      isQueuingToUpload: false,
      isUpdatingFilenameFormat: false,
      errorMessage: null,
      selectedTimezone: '',
      shouldShowConfirmTimezoneAlert: false,
      shouldFocusTimezoneInput: false
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
    },
    confirmTimezoneAlertText () {
      const timezone = this.getTimezoneOptionText(this.selectedTimezone)
      return {
        title: `Upload audio in ${timezone}?`,
        message: `Please confirm if the filename timezone is correct. Your audio will be upload to the system in <b>${timezone}</b>?`,
        confirmTitle: `Upload audio in ${this.selectedTimezone}`,
        cancelTitle: `Recheck`
      }
    }
  },
  created () {
    this.selectedTimezone = this.defaultTimezone
  },
  methods: {
    async queueToUpload () {
      this.shouldFocusTimezoneInput = false
      this.shouldShowConfirmTimezoneAlert = false

      this.isQueuingToUpload = true

      // set session id
      const sessionId = this.$store.state.AppSetting.currentUploadingSessionId || '_' + Math.random().toString(36).substr(2, 9)
      await this.$store.dispatch('setCurrentUploadingSessionId', sessionId)

      const streamId = this.selectedStreamId
      const query = { streamId, state: PREPARING }
      await ipcRendererSend('db.files.bulkUpdate', `db.files.bulkUpdate.${Date.now()}`, {
        where: query,
        values: { state: WAITING, stateMessage: null, sessionId, timezone: this.getSelectedTimezoneValue() }
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
          state: fileState.preparedGroup
        }
      })
      this.$emit('onNeedResetFileList')
      this.$emit('onNeedResetStreamList')
      this.isDeletingAllFiles = false
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
    },
    recheckTimezoneSettings () {
      this.shouldShowConfirmTimezoneAlert = false
      this.shouldFocusTimezoneInput = true
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
