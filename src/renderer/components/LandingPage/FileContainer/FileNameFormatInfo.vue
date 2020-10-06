<template>
  <div class="wrapper">
    <div>
      <span class="wrapper__title">Filename Format</span>
      <div class="dropdown" :class="{'is-active': showFileNameFormatDropDown}">
        <div class="dropdown-trigger">
          <button class="button" :class="{'is-loading': isUpdatingFilenameFormat}" aria-haspopup="true" aria-controls="dropdown-menu" @click="showFileNameFormatDropDown = !showFileNameFormatDropDown" v-click-outside="hide">
            <span>{{ (isCustomTimestampFormat ? 'custom ・ ' : '') + selectedStream.timestampFormat }}</span>
            <span class="icon is-small">
              <font-awesome-icon :icon="icons.arrowDown" aria-hidden="true" />
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
import File from '../../../store/models/File'
import Stream from '../../../store/models/Stream'
import FileNameFormatSettings from '../FileNameFormatSettings/FileNameFormatSettings.vue'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import fileState from '../../../../../utils/fileState'
import fileFormat from '../../../../../utils/FileFormat'
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
      selectedStreamId: state => state.Stream.selectedStreamId
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
    queueToUpload () {
      this.$file.putFilesIntoUploadingQueue(this.readyToUploadFiles)
      const tabObject = {}
      tabObject[this.selectedStreamId] = 'Queued'
      this.$store.dispatch('setSelectedTab', tabObject)
    },
    confirmToClearAllFiles () {
      this.clearAllFiles()
    },
    clearAllFiles () {
      this.isDeletingAllFiles = true
      this.preparingFiles.forEach(file => {
        File.delete(file.id)
      })
      // the component will be removed once delete successfully, and isDeletingAllFiles will be automatically changed to be 'false' automatically
    },
    hide () {
      this.showFileNameFormatDropDown = false
    },
    openFileNameFormatSettingModal () {
      this.showSettingModal = true
    },
    closeFileNameFormatSettingModal () {
      console.log('closeFileNameFormatSettingModal')
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
