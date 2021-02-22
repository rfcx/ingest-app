<template>
  <div class="wrapper" v-infinite-scroll="loadMore" infinite-scroll-distance="10">
    <header-view></header-view>
    <tab :preparingFiles="preparingFiles" :queuingFiles="queuingFiles" :completedFiles="completedFiles" :selectedTab="selectedTab"></tab>
    <file-name-format-info v-if="selectedTab === 'Prepared' && selectedStream.isPreparing" :preparingFiles="preparingFiles"></file-name-format-info>
    <file-list ref="fileList" :preparingFiles="preparingFiles" :queuingFiles="queuingFiles" :completedFiles="completedFiles" :selectedTab="selectedTab" :isDragging="isDragging" @onImportFiles="onImportFiles"></file-list>
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
    files () {
      return File.query().where('streamId', this.selectedStreamId).get()
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
    }
  },
  watch: {
    selectedTab: (previousTabName, newTabName) => {
      if (!this) return // Weird error that this is sometimes undefined
      if (previousTabName !== newTabName) {
        this.$refs.fileList.resetLoadMore()
      }
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
