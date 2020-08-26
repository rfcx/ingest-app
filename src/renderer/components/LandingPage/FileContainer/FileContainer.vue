<template>
  <div class="file-container__wrapper">
    <header-view></header-view>
    <tab :files="files" :selectedTab="selectedTab"></tab>
    <file-name-format-info v-if="selectedTab === 'Prepared' && preparingFiles.length > 0" :preparingFiles="preparingFiles"></file-name-format-info>
    <file-list :preparingFiles="preparingFiles" :queuingFiles="queuingFiles" :completedFiles="completedFiles" :selectedTab="selectedTab" :isDragging="isDragging"></file-list>
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
// import FileList from '../FileList'

export default {
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
      return File.query().where('streamId', this.selectedStreamId).get()
        .sort((fileA, fileB) => {
          return new Date(fileB.timestamp) - new Date(fileA.timestamp)
        }).sort((fileA, fileB) => {
          return FileState.getStatePriority(fileA.state, fileA.stateMessage) - FileState.getStatePriority(fileB.state, fileB.stateMessage)
        })
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
    }
  }
}
</script>

<style lang="scss" scoped>
  .file-container {
    &__wrapper {
      height: $full-height !important;
      padding-top: $default-padding-margin !important;
      background: $backgroud-color-dark;
    }
  }
</style>
