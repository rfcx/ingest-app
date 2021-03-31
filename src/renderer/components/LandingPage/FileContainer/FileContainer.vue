<template>
  <div class="wrapper" v-infinite-scroll="loadMore" infinite-scroll-distance="10">
    <header-view></header-view>
    <tab :preparingGroup="getNumberOfFilesAndStatusToRenderInTab('Prepared')" :queuedGroup="getNumberOfFilesAndStatusToRenderInTab('Queued')" :completedGroup="getNumberOfFilesAndStatusToRenderInTab('Completed')" :selectedTab="selectedTab"></tab>
    <file-name-format-info v-if="selectedTab === 'Prepared' && preparingFiles.length > 0" :preparingFiles="preparingFiles"></file-name-format-info>
    <file-list ref="fileList" :files="getFilesInSelectedTab()" :numberOfQueuingFiles="queuingFiles.length" :selectedTab="selectedTab" :isDragging="isDragging" @onImportFiles="onImportFiles"></file-list>
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
export default {
  directives: { infiniteScroll },
  data () {
    return {
      files: [],
      preparingFiles: [],
      queuingFiles: [],
      completedFiles: [],
      fetchFilesInterval: null,
      selectedStream: null
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
      switch (tab) {
        case 'Prepared': return { numberOfFiles: this.preparingFiles.length, hasErrorFiles: this.checkIfHasErrorFiles(this.preparingFiles) }
        case 'Queued': return { numberOfFiles: this.queuingFiles.length, hasErrorFiles: this.checkIfHasErrorFiles(this.queuingFiles) }
        case 'Completed': return { numberOfFiles: this.completedFiles.length, hasErrorFiles: this.checkIfHasErrorFiles(this.completedFiles) }
      }
    },
    checkIfHasErrorFiles (files) {
      return files.filter((file) => file.state.includes('error')).length > 0
    },
    async reloadFiles () {
      this.files = await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { streamId: this.selectedStreamId } })
      this.preparingFiles = this.files.filter(file => FileState.isInPreparedGroup(file.state)).sort(fileComparator)
      this.queuingFiles = this.files.filter(file => FileState.isInQueuedGroup(file.state)).sort(fileComparator)
      this.completedFiles = this.files.filter(file => FileState.isInCompletedGroup(file.state)).sort(fileComparator)
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
