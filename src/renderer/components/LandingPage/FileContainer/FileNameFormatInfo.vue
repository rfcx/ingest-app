<template>
  <div class="preparing-file-settings__wrapper">
    <div class="preparing-file-settings__name-format-wrapper">
      <span class="preparing-file-settings__name-format-title">Filename format</span>
      <div class="is-flex flex-row align-center">
          <div class="preparing-file-settings__name-format-description">{{ (selectedStream.timestampFormat !== 'Auto-detect' ? 'custom ・ ' : '') + selectedStream.timestampFormat }}</div>
          <div class="preparing-file-settings__edit-button" title="Edit filename format">
            <font-awesome-icon :icon="iconPencil" @click="openFileNameFormatSettingModal()"></font-awesome-icon>
          </div>
      </div>

    </div>
    <div class="preparing-file-settings__actions-wrapper">
      <button type="button" class="button is-rounded is-cancel" @click.prevent="confirmToClearAllFiles()" :class="{ 'is-loading': isDeletingAllFiles }">Clear all</button>
      <button type="button" class="button is-rounded is-primary" @click.prevent="queueToUpload()" :disabled="readyToUploadFiles.length < 1 || isDeletingAllFiles">Start upload ({{readyToUploadFiles.length}})</button>
    </div>
    <div class="preparing-file-settings__timestamp-modal modal is-active" v-if="showSettingModal">
      <div class="modal-background"></div>
      <file-name-format-settings
        :format="selectedStream.timestampFormat"
        @onClose="closeFileNameFormatSettingModal"
        @save="onFormatSave"/>
      <button class="modal-close is-large" aria-label="close"></button>
    </div>
  </div>
</template>

<script>

import { mapState } from 'vuex'
import File from '../../../store/models/File'
import Stream from '../../../store/models/Stream'
import FileNameFormatSettings from './FileNameFormatSettings'
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons'
import fileState from '../../../../../utils/fileState'

export default {
  props: {
    preparingFiles: {
      type: Array,
      default: () => []
    }
  },
  components: { FileNameFormatSettings },
  data () {
    return {
      iconPencil: faPencilAlt,
      showSettingModal: false,
      isDeletingAllFiles: false
    }
  },
  computed: {
    ...mapState({
      selectedStreamId: state => state.Stream.selectedStreamId
    }),
    selectedStream () {
      return Stream.find(this.selectedStreamId)
    },
    readyToUploadFiles () {
      return this.preparingFiles.filter(file => file.isPreparing)
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
    openFileNameFormatSettingModal () {
      this.showSettingModal = true
    },
    closeFileNameFormatSettingModal () {
      console.log('closeFileNameFormatSettingModal')
      this.showSettingModal = false
    },
    async onFormatSave (format = '') {
      this.closeFileNameFormatSettingModal()
      console.log('onFormatSave', format)
      const objectFiles = this.preparingFiles.filter(file => fileState.canChangeTimestampFormat(file.state, file.stateMessage)) || []

      try {
        await this.$file.updateFilesFormat(this.selectedStream, objectFiles, format)
      } catch (e) {
        console.log(`Error update files format '${format}'`, e.message)

        // TODO: Show notify error to user
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .preparing-file-settings {
    &__wrapper {
      padding: $default-padding-margin;
      display: flex;
      justify-content: space-between;
      align-self: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    &__name-format-title {
      font-weight: $title-font-weight;
      display: block;
    }
    &__name-format-description {
      color: $secondary-text-color;
      display: inline-block;
    }
    &__edit-button {
      padding-left: 8px;
      color: $edit-icon-color !important;
      font-size: 14px;
      cursor: pointer;
    }
  }
  .flex-row {
    flex-direction: row;
  }
  .align-center {
    align-items: center;
  }
</style>
