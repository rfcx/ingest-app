<template>
  <div class="wrapper" v-infinite-scroll="loadMore" infinite-scroll-distance="10">
    <header-view :selectedStream="selectedStream"></header-view>
    <tab :preparingGroup="getNumberOfFilesAndStatusToRenderInTab('Prepared')" :queuedGroup="getNumberOfFilesAndStatusToRenderInTab('Queued')" :completedGroup="getNumberOfFilesAndStatusToRenderInTab('Completed')" :selectedTab="selectedTab"></tab>
    <file-name-format-info v-if="selectedTab === 'Prepared' && hasPreparingFiles" :numberOfReadyToUploadFiles="numberOfReadyToUploadFiles" :selectedStream="selectedStream" @onNeedResetFileList="resetFiles"></file-name-format-info>
    <file-list ref="fileList" :files="files" :hasFileInQueued="hasFileInQueued" :selectedTab="selectedTab" :isDragging="isDragging" :isFetching="isFetching" @onImportFiles="onImportFiles" @onNeedResetFileList="resetFiles"></file-list>
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
      console.log('onImportFiles = filecontainer', files)
      this.$emit('onImportFiles', files)
      // await this.resetFiles()
    },
    loadMore () {
      this.$refs.fileList.loadMore()
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
    calculateNumberOfFilesInTab (tab) {
      let groupFileCount = []
      switch (tab) {
        case 'Prepared':
          groupFileCount = this.stats.filter(group => FileState.isInPreparedGroup(group.state))
          break
        case 'Queued':
          groupFileCount = this.stats.filter(group => FileState.isInQueuedGroup(group.state))
          break
        case 'Completed':
          groupFileCount = this.stats.filter(group => FileState.isInCompletedGroup(group.state))
          break
      }
      return groupFileCount.map(s => s.stateCount).reduce((a, b) => a + b, 0)
    },
    checkIfHasErrorFiles (files) {
      return files.filter((file) => file.state.includes('error')).length > 0
    },
    async reloadFiles (query) {
      const currentFiles = this.files
      const newFiles = await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, {
        where: query
      })
      this.files = mergeById(currentFiles, newFiles)
      this.stats = await ipcRendererSend('db.files.filesInStreamCount', `db.files.filesInStreamCount.${Date.now()}`, this.selectedStreamId)
    },
    async initFilesFetcher () {
      // fetch at first load
      this.isFetching = true
      await this.reloadFiles(this.getQueryBySelectedTabAndUpdatedAt(this.selectedTab, false))
      this.isFetching = false
      // and set timer to fetch
      this.fetchFilesInterval = setInterval(() => {
        this.reloadFiles(this.getQueryBySelectedTabAndUpdatedAt(this.selectedTab, true))
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
        this.$refs.fileList.resetLoadMore()
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
