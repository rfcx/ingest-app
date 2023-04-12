<template>
<div class="wrapper">
  <div class="flex-end">
    <button
      type="button"
      class="button is-rounded is-cancel mr-2"
      :class="{ 'is-loading': isRemoveQueuedFiles }"
      :disabled="isProcessingUploading"
      @click.prevent="removeQueuedFiles()"
    >Clear all</button>
    <button
      type="button"
      class="button is-rounded is-primary"
      :class="{ 'is-loading': isProcessingUploading }"
      :disabled="isRemoveQueuedFiles || isProcessingUploading"
      @click.prevent="stoppedFileCount? startUpload() : stopUpload()"
      >{{ stoppedFileCount ? `Start Upload (${stoppedFileCount})` : `Stop Upload (${queuedFileCount})` }}
    </button>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'
import FileState from '../../../../../utils/fileState'
import ipcRendererSend from '../../../services/ipc'

export default {
  props: {
    stats: Array,
    queuedFileCount: {
      type: Number,
      default: 0
    },
    stoppedFileCount: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      isProcessingUploading: false,
      isRemoveQueuedFiles: false
    }
  },
  computed: {
    ...mapState({
      selectedStreamId: state => state.AppSetting.selectedStreamId
    })
  },
  methods: {
    async startUpload () {
      try {
        this.isProcessingUploading = true
        let files = await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { streamId: this.selectedStreamId, state: FileState.state.STOPPED } })
        console.error('start files', files)
        await this.$file.putFilesIntoUploadingQueue(files)
        this.isProcessingUploading = false
      } catch (e) {
        console.error('[FileQueued] error start upload', e)
        this.isProcessingUploading = false
      }

      // set selected tab to be queue tab
      const tabObject = {}
      tabObject[this.selectedStreamId] = 'Queued'
      await this.$store.dispatch('setSelectedTab', tabObject)
    },
    async stopUpload () {
      try {
        this.isProcessingUploading = true
        let files = await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { streamId: this.selectedStreamId, state: [FileState.state.CONVERTING, FileState.state.UPLOADING, FileState.state.WAITING] } })
        console.log('stop files', files)
        const stoppedFiles = await this.$file.stopQueuedFiles(files, this.selectedStreamId)
        this.$emit('stoppedFileCount', stoppedFiles)
        this.isProcessingUploading = false
        console.log('stopped', this.isProcessingUploading, stoppedFiles, this.stoppedFileCount)
      } catch (e) {
        console.error('[FileQueued] error stop upload', e)
        this.isProcessingUploading = false
      }

      // set selected tab to be queue tab
      const tabObject = {}
      tabObject[this.selectedStreamId] = 'Queued'
      await this.$store.dispatch('setSelectedTab', tabObject)
    },
    async removeQueuedFiles () {
      if (this.isRemoveQueuedFiles) return // prevent double click
      this.isRemoveQueuedFiles = true
      try {
        let files = await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { streamId: this.selectedStreamId, state: [FileState.state.CONVERTING, FileState.state.UPLOADING, FileState.state.WAITING, FileState.state.STOPPED] } })
        const queuedAndStoppedFiles = await this.$file.removeQueuedFiles(files, this.selectedStreamId)
        this.isRemoveQueuedFiles = false
        const stoppedFiles = await this.$file.getExistingStoppedFiles(this.selectedStreamId)
        this.$emit('stoppedFileCount', stoppedFiles)
        if (!queuedAndStoppedFiles) {
          // set selected tab to be queue tab
          const tabObject = {}
          tabObject[this.selectedStreamId] = 'Prepared'
          await this.$store.dispatch('setSelectedTab', tabObject)
        }
      } catch (e) {
        this.isRemoveQueuedFiles = false
        console.error('[FileQueued] error remove queued files', e)
      }
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
  }

  .flex-end {
    justify-content: flex-end;
    margin-left: auto;
  }

  .mr-2 {
    margin-right: 2px;
  }
</style>
