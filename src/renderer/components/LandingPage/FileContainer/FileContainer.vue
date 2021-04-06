<template>
  <div class="wrapper" v-infinite-scroll="loadMore" infinite-scroll-distance="10">
    <header-view :selectedStream="selectedStream"></header-view>
    <tab :preparingGroup="getNumberOfFilesAndStatusToRenderInTab('Prepared')" :queuedGroup="getNumberOfFilesAndStatusToRenderInTab('Queued')" :completedGroup="getNumberOfFilesAndStatusToRenderInTab('Completed')" :selectedTab="selectedTab"></tab>
    <file-name-format-info v-if="selectedTab === 'Prepared' && hasPreparingFiles" :numberOfReadyToUploadFiles="numberOfReadyToUploadFiles" :selectedStream="selectedStream"></file-name-format-info>
    <file-list ref="fileList" :files="files" :hasFileInQueued="hasFileInQueued" :selectedTab="selectedTab" :isDragging="isDragging" @onImportFiles="onImportFiles"></file-list>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import HeaderView from '../HeaderView'
import Tab from './Tab'
import FileNameFormatInfo from './FileNameFormatInfo'
import FileList from './FileList'
import FileState from '../../../../../utils/fileState'
// import File from '../../../store/models/File'
// import Stream from '../../../store/models/Stream'
import infiniteScroll from 'vue-infinite-scroll'
import ipcRendererSend from '../../../services/ipc'

const fileComparator = (fileA, fileB) => {
  const stateResult = FileState.getStatePriority(fileA.state) - FileState.getStatePriority(fileB.state)
  if (stateResult !== 0) {
    return stateResult
  }
  return new Date(fileA.timestamp) - new Date(fileB.timestamp)
}

const DEFAULT_LIMIT = 30

export default {
  directives: { infiniteScroll },
  data () {
    return {
      files: [],
      fileCount: [],
      fetchFilesInterval: null,
      selectedStream: null,
      offset: 0
    }
  },
  props: {
    isDragging: Boolean
  },
  components: {
    HeaderView, Tab, FileNameFormatInfo, FileList
  },
  computed: {
    ...mapState({
      selectedStreamId: state => state.AppSetting.selectedStreamId
    }),
    selectedTab () {
      const savedSelectedTab = this.$store.getters.getSelectedTabByStreamId(this.selectedStreamId)
      return savedSelectedTab || this.getDefaultSelectedTab()
    },
    numberOfReadyToUploadFiles () {
      const preparingGroup = this.fileCount.find(group => FileState.isPreparing(group.state))
      return preparingGroup ? preparingGroup.stateCount : 0
    },
    hasPreparingFiles () {
      return this.fileCount.find(group => FileState.isInPreparedGroup(group.state))
    },
    hasFileInQueued () {
      return this.fileCount.find(group => FileState.isInQueuedGroup(group.state))
    }
  },
  methods: {
    getDefaultSelectedTab () {
      if (this.selectedStream) {
        if (this.selectedStream.isUploading) return 'Queued'
        if (this.selectedStream.isCompleted) return 'Completed'
      }
      return 'Prepared'
    },
    onImportFiles (files) {
      this.$emit('onImportFiles', files)
    },
    loadMore () {
      this.$refs.fileList.loadMore()
    },
    getStatesOfSelectedTab () {
      switch (this.selectedTab) {
        case 'Prepared': return FileState.preparedGroup
        case 'Queued': return FileState.queuedGroup
        case 'Completed': return FileState.completedGroup
      }
    },
    getNumberOfFilesAndStatusToRenderInTab (tab) {
      let hasErrorFiles = false
      switch (tab) {
        case 'Prepared':
          hasErrorFiles = this.fileCount.find(group => FileState.isLocalError(group.state))
          break
        case 'Queued':
          hasErrorFiles = false
          break
        case 'Completed':
          hasErrorFiles = this.fileCount.find(group => FileState.isServerError(group.state))
          break
      }
      return {
        numberOfFiles: this.calculateNumberOfFilesInTab(tab),
        hasErrorFiles
      }
    },
    calculateNumberOfFilesInTab (tab) {
      let groupFileCount = []
      switch (tab) {
        case 'Prepared':
          groupFileCount = this.fileCount.filter(group => FileState.isInPreparedGroup(group.state))
          break
        case 'Queued':
          groupFileCount = this.fileCount.filter(group => FileState.isInQueuedGroup(group.state))
          break
        case 'Completed':
          groupFileCount = this.fileCount.filter(group => FileState.isInCompletedGroup(group.state))
          break
      }
      return groupFileCount.map(s => s.stateCount).reduce((a, b) => a + b, 0)
    },
    async reloadFiles () {
      this.fileCount = await ipcRendererSend('db.files.filesCount', `db.files.filesCount.${Date.now()}`, { where: { streamId: this.selectedStreamId } })
      this.files = (await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, {
        where: {
          streamId: this.selectedStreamId,
          state: this.getStatesOfSelectedTab()
        },
        offset: this.offset,
        limit: DEFAULT_LIMIT }))
        .sort(fileComparator)
    },
    initFilesFetcher () {
      // fetch at first load
      this.reloadFiles()
      // and set timer to fetch
      this.fetchFilesInterval = setInterval(() => {
        this.reloadFiles()
      }, 2000)
    },
    async getCurrentStream () {
      this.selectedStream = await ipcRendererSend('db.streams.get', `db.streams.get.${Date.now()}`, this.selectedStreamId)
    }
  },
  watch: {
    selectedStreamId: {
      handler: async function (previousStream, newStream) {
        if (previousStream === newStream) return
        await this.getCurrentStream()
        await this.reloadFiles()
      }
    },
    selectedTab (previousTabName, newTabName) {
      if (previousTabName !== newTabName) {
        this.$refs.fileList.resetLoadMore()
        this.offset = 0
        this.reloadFiles()
      }
    }
  },
  async created () {
    await this.getCurrentStream()
    this.initFilesFetcher()
  },
  beforeDestroy () {
    if (this.fetchFilesInterval) {
      clearInterval(this.fetchFilesInterval)
      this.fetchFilesInterval = null
    }
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    padding-top: $default-padding-margin;
    background: $backgroud-color-dark;
  }
</style>
