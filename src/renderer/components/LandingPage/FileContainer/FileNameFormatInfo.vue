<template>
  <div class="wrapper">
    <div>
      <span class="wrapper__title">Filename Format</span>
      <div class="dropdown" :class="{'is-active': showFileNameFormatDropDown}">
        <div class="dropdown-trigger">
          <button class="button" :class="{'is-loading': isUpdatingFilenameFormat}" aria-haspopup="true" aria-controls="dropdown-menu" @click="showFileNameFormatDropDown = !showFileNameFormatDropDown" v-click-outside="hide">
            <span>{{ (isCustomTimestampFormat ? 'custom ・ ' : '') + selectedStream.timestampFormat }}</span>
            <span class="icon is-small">
              <fa-icon :icon="icons.arrowDown" aria-hidden="true" />
            </span>
          </button>
        </div>
        <div class="dropdown-menu" id="dropdown-menu" role="menu">
          <div class="dropdown-content">
            <a href="#" class="dropdown-item"
              v-for="format in fileNameFormatOptions" 
              :key="format" 
              :class="{'is-active': format === selectedStream.timestampFormat}"
              @click="onFormatSave(format)">
              {{ format }}
            </a>
            <hr class="dropdown-divider">
            <a href="#" class="dropdown-item" @click="openFileNameFormatSettingModal">
              Custom...
            </a>
          </div>
        </div>
      </div>
    </div>
    <div>
      <button type="button" class="button is-rounded is-cancel" @click.prevent="confirmToClearAllFiles()" :class="{ 'is-loading': isDeletingAllFiles }">Clear all</button>
      <button type="button" class="button is-rounded is-primary" @click.prevent="queueToUpload()" :disabled="readyToUploadFiles.length < 1 || isDeletingAllFiles">Start upload ({{readyToUploadFiles.length}})</button>
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
import Stream from '../../../store/models/Stream'
import FileNameFormatSettings from '../FileNameFormatSettings/FileNameFormatSettings.vue'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import fileState from '../../../../../utils/fileState'
import fileFormat from '../../../../../utils/FileFormat'
import DatabaseEventName from '../../../../../utils/DatabaseEventName'
import ErrorAlert from '../../Common/ErrorAlert'

export default {
  props: {
    preparingFiles: {
      type: Array,
      default: () => []
    }
  },
  components: { FileNameFormatSettings, ErrorAlert },
  data () {
    return {
      showSettingModal: false,
      isDeletingAllFiles: false,
      isQueuingToUpload: false,
      showFileNameFormatDropDown: false,
      isUpdatingFilenameFormat: false,
      errorMessage: null
    }
  },
  computed: {
    icons: () => ({
      arrowDown: faAngleDown
    }),
    ...mapState({
      selectedStreamId: state => state.AppSetting.selectedStreamId
    }),
    selectedStream () {
      return Stream.find(this.selectedStreamId)
    },
    selectedTimestampFormat () {
      return this.selectedStream.timestampFormat
    },
    readyToUploadFiles () {
      return this.preparingFiles.filter(file => file.isPreparing)
    },
    fileNameFormatOptions () {
      return Object.values(fileFormat.fileFormat)
    },
    isCustomTimestampFormat () {
      return !this.fileNameFormatOptions.includes(this.selectedStream.timestampFormat)
    }
  },
  methods: {
    async queueToUpload () {
      this.isQueuingToUpload = true

      // set session id
      const sessionId = this.$store.state.AppSetting.currentUploadingSessionId || '_' + Math.random().toString(36).substr(2, 9)
      this.$store.dispatch('setCurrentUploadingSessionId', sessionId)

      // completion listener
      const t0 = performance.now()
      let listen = (event, arg) => {
        this.$electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.putFilesIntoUploadingQueueResponse, listen)
        this.isQueuingToUpload = false
        const t1 = performance.now()
        console.log('[Measure] putFilesIntoUploadingQueue ' + (t1 - t0) + ' ms')
      }

      // emit to main process to put file in uploading queue
      const data = {streamId: this.selectedStreamId, sessionId: sessionId}
      this.$electron.ipcRenderer.send(DatabaseEventName.eventsName.putFilesIntoUploadingQueueRequest, data)
      this.$electron.ipcRenderer.on(DatabaseEventName.eventsName.putFilesIntoUploadingQueueResponse, listen)

      // set selected tab to be queue tab
      const tabObject = {}
      tabObject[this.selectedStreamId] = 'Queued'
      this.$store.dispatch('setSelectedTab', tabObject)

      // always enable uploading process
      this.$store.dispatch('enableUploadingProcess', true)
    },
    confirmToClearAllFiles () {
      this.clearAllFiles()
    },
    async clearAllFiles () {
      this.isDeletingAllFiles = true
      const t0 = performance.now()
      let listen = (event, arg) => {
        this.$electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.deletePreparingFilesResponse, listen)
        this.isDeletingAllFiles = false
        const t1 = performance.now()
        console.log('[Measure] delete prepare files ' + (t1 - t0) + ' ms')
      }
      this.$electron.ipcRenderer.send(DatabaseEventName.eventsName.deletePreparingFilesRequest, this.selectedStreamId)
      this.$electron.ipcRenderer.on(DatabaseEventName.eventsName.deletePreparingFilesResponse, listen)
    },
    hide () {
      this.showFileNameFormatDropDown = false
    },
    openFileNameFormatSettingModal () {
      this.showSettingModal = true
    },
    closeFileNameFormatSettingModal () {
      this.showSettingModal = false
    },
    async onFormatSave (format = '') {
      this.showFileNameFormatDropDown = false
      this.closeFileNameFormatSettingModal()
      console.log('onFormatSave', format)
      const objectFiles = this.preparingFiles.filter(file => fileState.canChangeTimestampFormat(file.state, file.stateMessage)) || []
      this.isUpdatingFilenameFormat = true
      this.$file.updateFilesFormat(this.selectedStream, objectFiles, format).then(_ => {
      }).catch(error => {
        this.isUpdatingFilenameFormat = false
        console.log(`Error update files format '${format}'`, error.message)
        this.errorMessage = error.message
      })
    }
  },
  watch: {
    selectedTimestampFormat (newValue, oldValue) {
      if (newValue === oldValue) return
      this.isUpdatingFilenameFormat = false
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
  .flex-row {
    flex-direction: row;
  }
  .align-center {
    align-items: center;
  }
  .dropdown {
    margin-top: 4px;
  }
</style>
