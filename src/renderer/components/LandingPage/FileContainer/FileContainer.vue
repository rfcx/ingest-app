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
import File from '../../../store/models/File'
import Stream from '../../../store/models/Stream'
import infiniteScroll from 'vue-infinite-scroll'

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
      fetchFilesInterval: null
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
    selectedStream () {
      return Stream.find(this.selectedStreamId)
    },
    selectedTab () {
      const savedSelectedTab = this.$store.getters.getSelectedTabByStreamId(this.selectedStreamId)
      return savedSelectedTab || this.getDefaultSelectedTab()
    },
    preparingFiles () {
      return this.files.filter(file => FileState.isInPreparedGroup(file.state)).sort(fileComparator)
    },
    queuingFiles () {
      return this.files.filter(file => FileState.isInQueuedGroup(file.state)).sort(fileComparator)
    },
    completedFiles () {
      return this.files.filter(file => FileState.isInCompletedGroup(file.state)).sort(fileComparator)
    }
  },
  methods: {
    getDefaultSelectedTab () {
      if (this.selectedStream.isPreparing) { return 'Prepared' }
      if (this.selectedStream.isUploading) { return 'Queued' }
      if (this.selectedStream.isCompleted) { return 'Completed' }
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
      return files.filter((file) => file.isError).length > 0
    },
    reloadFiles () {
      this.files = File.query().where('streamId', this.selectedStreamId).get()
    },
    initFilesFetcher () {
      // fetch at first load
      this.reloadFiles()
      // and set timer to fetch
      this.fetchFilesInterval = setInterval(() => {
        this.reloadFiles()
      }, 2000)
    }
  },
  watch: {
    selectedStreamId: {
      handler: function (previousStream, newStream) {
        if (previousStream === newStream) return
        this.reloadFiles()
      }
    },
    selectedTab (previousTabName, newTabName) {
      if (previousTabName !== newTabName) {
        this.$refs.fileList.resetLoadMore()
        this.reloadFiles()
      }
    }
  },
  created () {
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
