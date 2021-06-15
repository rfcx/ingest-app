<template>
    <div class="wrapper" v-infinite-scroll="loadMore" infinite-scroll-distance="10" :infinite-scroll-disabled="!infiniteScrollEnabled">
    <header-view :selectedStream="selectedStream"></header-view>
    <tab :preparingGroup="getNumberOfFilesAndStatusToRenderInTab('Prepared')" :queuedGroup="getNumberOfFilesAndStatusToRenderInTab('Queued')" :completedGroup="getNumberOfFilesAndStatusToRenderInTab('Completed')" :selectedTab="selectedTab"></tab>
    <file-name-format-info v-if="selectedTab === 'Prepared' && hasPreparingFiles" :numberOfReadyToUploadFiles="numberOfReadyToUploadFiles" :selectedStream="selectedStream" @onNeedResetFileList="resetFiles" @onNeedResetStreamList="resetStreams"></file-name-format-info>
    <summary-view :stats="getStatsOfTab(selectedTab)" :retryableFileCount="retryableFileCount" v-if="selectedTab === 'Completed' && hasCompletedFiles"></summary-view>
    <file-list ref="fileList" :files="files" :stats="getStatsOfTab(selectedTab)" :hasFileInQueued="hasFileInQueued" :selectedTab="selectedTab" :isDragging="isDragging" :isFetching="files.length <= 0 && isFetching" :isLoadingMore="isFetching" @onImportFiles="onImportFiles" @onNeedResetFileList="resetFiles"></file-list>
</div>
</template>

<script>
import { mapState } from 'vuex'
import HeaderView from '../HeaderView'
import Tab from './Tab'
import FileNameFormatInfo from './FileNameFormatInfo'
import FileList from './FileList'
import SummaryView from './Summary'
import FileState from '../../../../../utils/fileState'
import infiniteScroll from 'vue-infinite-scroll'
import ipcRendererSend from '../../../services/ipc'

const fileComparator = (fileA, fileB) => {
  const stateResult = FileState.getStatePriority(fileA.state) - FileState.getStatePriority(fileB.state)
  if (stateResult !== 0) {
    return stateResult
  }
  return new Date(fileA.timestamp) - new Date(fileB.timestamp)
}

const mergeById = (oldArray, newArray) => {
  if (oldArray.length <= 0) return newArray
  const updatedItems = oldArray.map(item => {
    const obj = newArray.find(o => o.id === item.id)
    return { ...item, ...obj }
  })
  const newItems = newArray.filter(o1 => !oldArray.some(o2 => o1.id === o2.id))
  return updatedItems.concat(newItems)
}

export default {
  directives: { infiniteScroll },
  data () {
    return {
      files: [],
      stats: [],
      retryableFileCount: 0,
      fetchFilesInterval: null,
      selectedStream: null,
      isFetching: false
    }
  },
  props: {
    isDragging: Boolean
  },
  components: {
    HeaderView, Tab, FileNameFormatInfo, FileList, SummaryView
  },
  computed: {
    ...mapState({
      selectedStreamId: state => state.AppSetting.selectedStreamId,
      currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId,
      isUploadingProcessEnabled: state => state.AppSetting.isUploadingProcessEnabled
    }),
    selectedTab () {
      const savedSelectedTab = this.$store.getters.getSelectedTabByStreamId(this.selectedStreamId)
      return savedSelectedTab || this.getDefaultSelectedTab()
    },
    hasPreparingFiles () {
      return this.stats.find(group => FileState.isInPreparedGroup(group.state)) !== undefined
    },
    hasFileInQueued () {
      return this.stats.find(group => FileState.isInQueuedGroup(group.state)) !== undefined
    },
    hasCompletedFiles () {
      return this.stats.find(group => FileState.isInCompletedGroup(group.state)) !== undefined
    },
    numberOfReadyToUploadFiles () {
      const preparingGroup = this.stats.find(group => FileState.isPreparing(group.state))
      return preparingGroup ? preparingGroup.stateCount : 0
    },
    infiniteScrollEnabled () {
      return !this.isFetching && !this.isUploading
    },
    isUploading () {
      return this.currentUploadingSessionId && this.isUploadingProcessEnabled
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
    async onImportFiles (files) {
      console.log('onImportFiles = filecontainer', files)
      this.$emit('onImportFiles', files)
    },
    async loadMore () {
      if (this.isUploading) { return } // only support pagination when not in uploading mode
      this.isFetching = true
      const offset = this.files.length
      const query = this.getQueryBySelectedTabAndUpdatedAt(this.selectedTab, false)
      await this.reloadFiles(query, offset, true)
      this.isFetching = false
    },
    getQueryBySelectedTabAndUpdatedAt (selectedTab, onlyLatestUpdated = false) {
      let commonQuery = { streamId: this.selectedStreamId }
      if (onlyLatestUpdated) {
        const currentFiles = this.files
        const latestUpdateDate = currentFiles.map(file => new Date(file.updatedAt).valueOf()).reduce((a, b) => a <= b ? b : a, 0) || 0
        commonQuery.updatedAt = {
          '$gte': latestUpdateDate
        }
      }
      switch (selectedTab) {
        case 'Prepared':
          return { ...commonQuery, state: FileState.preparedGroup }
        case 'Queued':
          return { ...commonQuery, state: FileState.queuedGroup }
        case 'Completed':
          return { ...commonQuery, state: FileState.completedGroup }
      }
    },
    getNumberOfFilesAndStatusToRenderInTab (tab) {
      let hasErrorFiles = false
      switch (tab) {
        case 'Prepared':
          hasErrorFiles = this.stats.find(group => FileState.isLocalError(group.state))
          break
        case 'Queued':
          hasErrorFiles = false
          break
        case 'Completed':
          hasErrorFiles = this.stats.find(group => FileState.isServerError(group.state))
          break
      }
      return {
        numberOfFiles: this.calculateNumberOfFilesInTab(tab),
        hasErrorFiles
      }
    },
    getStatsOfTab (tab) {
      switch (tab) {
        case 'Prepared':
          return this.stats.filter(group => FileState.isInPreparedGroup(group.state))
        case 'Queued':
          return this.stats.filter(group => FileState.isInQueuedGroup(group.state))
        case 'Completed':
          return this.stats.filter(group => FileState.isInCompletedGroup(group.state))
      }
    },
    calculateNumberOfFilesInTab (tab) {
      let groupFileCount = this.getStatsOfTab(tab)
      return groupFileCount.map(s => s.stateCount).reduce((a, b) => a + b, 0)
    },
    checkIfHasErrorFiles (files) {
      return files.filter((file) => FileState.isError(file.state)).length > 0
    },
    async reloadFiles (query, offset = null, merged = false) {
      let queryOpts = { where: query, order: [['state', 'ASC']] }
      if (typeof offset === 'number') { queryOpts = {...queryOpts, offset, limit: this.$getConst('DEFAULT_LIMIT')} }
      const newFiles = await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, queryOpts)
      if (merged) {
        const currentFiles = this.files
        this.files = mergeById(currentFiles, newFiles).sort(fileComparator)
        console.log(`reload files ${currentFiles.length} + ${newFiles.length} = ${this.files.length}`)
      } else {
        this.files = newFiles.sort(fileComparator)
        console.log(`update last ${this.$getConst('DEFAULT_LIMIT')} : ${this.files.length}`)
      }
    },
    async reloadStats () {
      this.stats = await ipcRendererSend('db.files.filesInStreamCount', `db.files.filesInStreamCount.${Date.now()}`, this.selectedStreamId)
      this.retryableFileCount = await ipcRendererSend('db.files.canRetryFilesInStreamCount', `db.files.canRetryFilesInStreamCount.${Date.now()}`, this.selectedStreamId)
    },
    async initFilesFetcher () {
      // fetch at first load
      this.isFetching = true
      await this.reloadStats()
      await this.reloadFiles(this.getQueryBySelectedTabAndUpdatedAt(this.selectedTab, false), 0)
      this.isFetching = false
      this.startFilesFetcher()
    },
    startFilesFetcher () {
      this.clearFilesFetcher() // make sure it's null before setting a new one
      if (this.files.length <= 0 || !this.isUploading) return // not initial a fetcher when there is no files or when the uploading process is not running
      this.fetchFilesInterval = setInterval(async () => {
        console.log('=> FETCHING INTERVAL: START')
        await this.reloadStats()
        console.log('=> FETCHING INTERVAL: RELOAD STATS')
        if (this.selectedTab === 'Prepared') { return }
        // not reloading files in prepare tab
        console.log('=> FETCHING INTERVAL: RELOAD FILES')
        await this.reloadFiles(this.getQueryBySelectedTabAndUpdatedAt(this.selectedTab, false), 0)
      }, 2000)
    },
    clearFilesFetcher () {
      if (this.fetchFilesInterval) {
        clearInterval(this.fetchFilesInterval)
        this.fetchFilesInterval = null
        console.log('FETCHING INTERVAL: STOP <=')
      }
    },
    async resetFiles () {
      this.stats = []
      this.files = []
      this.clearFilesFetcher()
      await this.initFilesFetcher()
    },
    resetStreams () {
      this.$emit('onNeedResetStreamList')
    },
    async getCurrentStream () {
      this.selectedStream = await ipcRendererSend('db.streams.get', `db.streams.get.${Date.now()}`, this.selectedStreamId)
    }
  },
  watch: {
    selectedStreamId: {
      handler: async function (newStream, previousStream) {
        if (previousStream === newStream) return
        await this.getCurrentStream()
        await this.resetFiles()
      }
    },
    selectedTab: {
      handler: async function (newTabName, previousTabName) {
        if (previousTabName === newTabName) return
        await this.resetFiles()
      }
    },
    isUploading: {
      handler: async function (newValue, previousValue) {
        if (previousValue === newValue) return
        if (newValue === true) { this.startFilesFetcher() }
        if (newValue === false || newValue === null) {
          setTimeout(() => {
            this.clearFilesFetcher()
          }, 2000)
        }
      }
    }
  },
  async created () {
    await this.getCurrentStream()
    this.initFilesFetcher()
  },
  beforeDestroy () {
    this.clearFilesFetcher()
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    padding-top: $default-padding-margin;
    background: $backgroud-color-dark;
  }
</style>
