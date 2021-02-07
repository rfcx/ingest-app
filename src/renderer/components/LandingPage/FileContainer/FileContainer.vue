<template>
  <div class="wrapper" v-infinite-scroll="loadMore" infinite-scroll-distance="10">
    <header-view></header-view>
    <tab :preparingFiles="preparingFiles" :queuingFiles="queuingFiles" :completedFiles="completedFiles" :selectedTab="selectedTab"></tab>
    <file-name-format-info v-if="selectedTab === 'Prepared' && preparingFiles.length > 0" :preparingFiles="preparingFiles"></file-name-format-info>
    <file-list ref="fileList" :preparingFiles="preparingFiles" :queuingFiles="queuingFiles" :completedFiles="completedFiles" :selectedTab="selectedTab" :isDragging="isDragging" @onImportFiles="onImportFiles"></file-list>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import File from '../../../store/models/File'
import HeaderView from '../HeaderView'
import Tab from './Tab'
import FileNameFormatInfo from './FileNameFormatInfo'
import FileList from './FileList'
import FileState from '../../../../../utils/fileState'
import infiniteScroll from 'vue-infinite-scroll'

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
      selectedStreamId: state => state.Stream.selectedStreamId
    }),
    selectedTab () {
      const savedSelectedTab = this.$store.getters.getSelectedTabByStreamId(this.selectedStreamId)
      return savedSelectedTab || this.getDefaultSelectedTab()
    },
    files () {
      const t0 = performance.now()
      const files = File.query().where('streamId', this.selectedStreamId).get()
      const sortedFiles = files
        .sort((fileA, fileB) => {
          return new Date(fileA.timestamp) - new Date(fileB.timestamp)
        }).sort((fileA, fileB) => {
          return FileState.getStatePriority(fileA.state, fileA.stateMessage) - FileState.getStatePriority(fileB.state, fileB.stateMessage)
        })
      const t1 = performance.now()
      console.log('[Measure] Query files ' + (t1 - t0) + ' ms')
      return sortedFiles
    },
    preparingFiles () {
      return this.files.filter(file => FileState.isInPreparedGroup(file.state))
    },
    queuingFiles () {
      return this.files.filter(file => FileState.isInQueuedGroup(file.state))
    },
    completedFiles () {
      return this.files.filter(file => FileState.isInCompletedGroup(file.state))
    }
  },
  methods: {
    getDefaultSelectedTab () {
      if (this.preparingFiles.length > 0) { return 'Prepared' }
      if (this.queuingFiles.length > 0) { return 'Queued' }
      if (this.completedFiles.length > 0) { return 'Completed' }
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
