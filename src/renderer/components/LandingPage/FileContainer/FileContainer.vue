<template>
    <div class="wrapper" v-infinite-scroll="loadMore" infinite-scroll-distance="10" :infinite-scroll-disabled="!infiniteScrollEnabled">
    <header-view :selectedStream="selectedStream"></header-view>
    <tab :preparingGroup="getNumberOfFilesAndStatusToRenderInTab('Prepared')" :queuedGroup="getNumberOfFilesAndStatusToRenderInTab('Queued')" :completedGroup="getNumberOfFilesAndStatusToRenderInTab('Completed')" :selectedTab="selectedTab"></tab>
    <file-name-format-info v-if="selectedTab === 'Prepared' && hasPreparingFiles" :numberOfReadyToUploadFiles="numberOfReadyToUploadFiles" :selectedStream="selectedStream" @onNeedResetFileList="resetFiles"></file-name-format-info>
    <file-list ref="fileList" :files="files" :stats="getStatsOfTab(selectedTab)" :hasFileInQueued="hasFileInQueued" :selectedTab="selectedTab" :isDragging="isDragging" :isFetching="files.length <= 0 && isFetching" @onImportFiles="onImportFiles" @onNeedResetFileList="resetFiles"></file-list>
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

const mergeById = (oldArray, newArray) => {
  if (oldArray.length <= 0) return newArray
  const updatedItems = oldArray.map(item => {
    const obj = newArray.find(o => o.id === item.id)
    return { ...item, ...obj }
  })
  const newItems = newArray.filter(o1 => !oldArray.some(o2 => o1.id === o2.id))
  return updatedItems.concat(newItems)
}

const DEFAULT_LIMIT = 20

export default {
  directives: { infiniteScroll },
  data () {
    return {
      files: [],
      stats: [],
      preparingFiles: [],
      queuingFiles: [],
      completedFiles: [],
      fetchFilesInterval: null,
      selectedStream: null,
      isFetching: false
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
    hasPreparingFiles () {
      return this.stats.find(group => FileState.isInPreparedGroup(group.state)) !== undefined
    },
    hasFileInQueued () {
      return this.stats.find(group => FileState.isInQueuedGroup(group.state)) !== undefined
    },
    numberOfReadyToUploadFiles () {
      const preparingGroup = this.stats.find(group => FileState.isPreparing(group.state))
      return preparingGroup ? preparingGroup.stateCount : 0
    },
    infiniteScrollEnabled () {
      return !this.isFetching && this.selectedTab === 'Prepared'
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
      if (this.selectedTab !== 'Prepared') { return } // only support pagination in prepare tab
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
      return files.filter((file) => file.state.includes('error')).length > 0
    },
    async reloadFiles (query, offset = null, merged = false) {
      let queryOpts = { where: query, order: [['updatedAt', 'DESC']] }
      if (typeof offset === 'number') { queryOpts = {...queryOpts, offset, limit: DEFAULT_LIMIT} }
      const newFiles = await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, queryOpts)
      if (merged) {
        const currentFiles = this.files
        this.files = mergeById(currentFiles, newFiles).sort(fileComparator)
        console.log(`reload files ${currentFiles.length} + ${newFiles.length} = ${this.files.length}`)
      } else {
        this.files = newFiles.sort(fileComparator)
      }
    },
    async reloadStats () {
      this.stats = await ipcRendererSend('db.files.filesInStreamCount', `db.files.filesInStreamCount.${Date.now()}`, this.selectedStreamId)
    },
    async initFilesFetcher () {
      // fetch at first load
      this.isFetching = true
      await this.reloadStats()
      await this.reloadFiles(this.getQueryBySelectedTabAndUpdatedAt(this.selectedTab, false), 0)
      this.isFetching = false
      this.fetchFilesInterval = setInterval(async () => {
        await this.reloadStats()
        if (this.selectedTab === 'Prepared') { return }
        // not reloading files in prepare tab
        await this.reloadFiles(this.getQueryBySelectedTabAndUpdatedAt(this.selectedTab, false), 0)
      }, 2000)
    },
    clearFilesFetcher () {
      if (this.fetchFilesInterval) {
        clearInterval(this.fetchFilesInterval)
        this.fetchFilesInterval = null
      }
    },
    async resetFiles () {
      this.files = []
      this.clearFilesFetcher()
      await this.initFilesFetcher()
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
        await this.resetFiles()
      }
    },
    selectedTab: {
      handler: async function (previousTabName, newTabName) {
        if (previousTabName === newTabName) return
        await this.resetFiles()
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
