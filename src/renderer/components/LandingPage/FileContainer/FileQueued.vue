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
      await this.$store.dispatch('enableUploadingProcess', false)
      try {
        this.isProcessingUploading = true
        let files = await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { streamId: this.selectedStreamId, state: [FileState.state.CONVERTING, FileState.state.UPLOADING, FileState.state.WAITING] } })
        console.log('stop files', files)
        const state = [FileState.state.CONVERTING, FileState.state.UPLOADING, FileState.state.WAITING]
        await this.$file.stopQueuedFiles(this.selectedStreamId, state)
        this.$emit('updateStoppedFileCount')
        this.isProcessingUploading = false
        await this.$store.dispatch('enableUploadingProcess', true)
      } catch (e) {
        console.error('[FileQueued] error stop upload', e)
        this.isProcessingUploading = false
        await this.$store.dispatch('enableUploadingProcess', true)
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
        const state = [FileState.state.CONVERTING, FileState.state.UPLOADING, FileState.state.WAITING, FileState.state.STOPPED]
        await this.$file.removeQueuedFiles(this.selectedStreamId, state)
        const queuedAndStoppedFiles = await this.$file.getExistingQueuedAndStoppedFiles(this.selectedStreamId)
        this.isRemoveQueuedFiles = false
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
  },
  watch: {
    queuedFileCount: {
      handler: async function (newValue, previousValue) {
        if (previousValue === newValue) return
        this.queuedFileCount = newValue
      }
    },
    stoppedFileCount: {
      handler: async function (newValue, previousValue) {
        if (previousValue === newValue) return
        this.stoppedFileCount = newValue
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
