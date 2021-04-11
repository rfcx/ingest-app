<template>
  <div class="wrapper" v-infinite-scroll="loadMore" infinite-scroll-distance="10">
    <header-view :selectedStream="selectedStream"></header-view>
    <tab :preparingGroup="getNumberOfFilesAndStatusToRenderInTab('Prepared')" :queuedGroup="getNumberOfFilesAndStatusToRenderInTab('Queued')" :completedGroup="getNumberOfFilesAndStatusToRenderInTab('Completed')" :selectedTab="selectedTab"></tab>
    <file-name-format-info v-if="selectedTab === 'Prepared' && hasPreparingFiles" :numberOfReadyToUploadFiles="numberOfReadyToUploadFiles" :selectedStream="selectedStream" @onNeedResetFileList="resetFiles"></file-name-format-info>
    <file-list ref="fileList" :files="getFilesInSelectedTab()" :hasFileInQueued="hasFileInQueued" :selectedTab="selectedTab" :isDragging="isDragging" :isFetching="isFetching" @onImportFiles="onImportFiles" @onNeedResetFileList="resetFiles"></file-list>
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

// const mergeById = (oldArray, newArray) => {
//   if (oldArray.length <= 0) return newArray
//   const updatedItems = oldArray.map(item => {
//     const obj = newArray.find(o => o.id === item.id)
//     return { ...item, ...obj }
//   })
//   const newItems = newArray.filter(o1 => !oldArray.some(o2 => o1.id === o2.id))
//   return updatedItems.concat(newItems)
// }

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
      return this.stats.find(group => FileState.isInPreparedGroup(group.state))
    },
    hasFileInQueued () {
      return this.stats.find(group => FileState.isInQueuedGroup(group.state))
    },
    numberOfReadyToUploadFiles () {
      const preparingGroup = this.stats.find(group => FileState.isPreparing(group.state))
      return preparingGroup ? preparingGroup.stateCount : 0
    }
    // preparingFiles () {
    //   return this.files.filter(file => FileState.isInPreparedGroup(file.state)).sort(fileComparator)
    // },
    // queuingFiles () {
    //   return this.files.filter(file => FileState.isInQueuedGroup(file.state)).sort(fileComparator)
    // },
    // completedFiles () {
    //   return this.files.filter(file => FileState.isInCompletedGroup(file.state)).sort(fileComparator)
    // }
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
    getFilesInSelectedTab () {
      switch (this.selectedTab) {
        case 'Prepared': return this.preparingFiles
        case 'Queued': return this.queuingFiles
        case 'Completed': return this.completedFiles
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
    async reloadFiles () {
      // const currentFiles = this.files
      // const latestUpdateDate = currentFiles.map(file => new Date(file.updatedAt).valueOf()).reduce((a, b) => a <= b ? b : a, 0) || 0
      // const newFiles = await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, {
      //   where: {
      //     streamId: this.selectedStreamId,
      //     updatedAt: {
      //       '$gte': latestUpdateDate
      //     }
      //   }
      // })
      // this.files = mergeById(currentFiles, newFiles)
      this.stats = await ipcRendererSend('db.files.filesInStreamCount', `db.files.filesInStreamCount.${Date.now()}`, this.selectedStreamId)
      this.files = []
      this.preparingFiles = this.files.filter(file => FileState.isInPreparedGroup(file.state)).sort(fileComparator)
      this.queuingFiles = this.files.filter(file => FileState.isInQueuedGroup(file.state)).sort(fileComparator)
      this.completedFiles = this.files.filter(file => FileState.isInCompletedGroup(file.state)).sort(fileComparator)
    },
    async initFilesFetcher () {
      // fetch at first load
      this.isFetching = true
      await this.reloadFiles()
      this.isFetching = false
      // and set timer to fetch
      this.fetchFilesInterval = setInterval(() => {
        this.reloadFiles()
      }, 2000)
    },
    async resetFiles () {
      this.isFetching = true
      this.files = []
      this.preparingFiles = []
      this.queuingFiles = []
      this.completedFiles = []
      await this.reloadFiles()
      this.isFetching = false
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
        await this.reloadFiles()
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
