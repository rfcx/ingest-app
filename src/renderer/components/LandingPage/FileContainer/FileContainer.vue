<template>
  <div class="landing__file-wrapper">
    <header-view></header-view>
    <tab :files="files"></tab>
    <file-name-format-info v-if="selectedTab === 'Prepared'"></file-name-format-info>
    <file-list :allFiles="files"></file-list>
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
  components: {
    HeaderView, Tab, FileNameFormatInfo, FileList
  },
  computed: {
    ...mapState({
      selectedStreamId: state => state.Stream.selectedStreamId,
      selectedTab: state => state.AppSetting.selectedTab
    }),
    files () {
      return File.query().where('streamId', this.selectedStreamId).get()
        .sort((fileA, fileB) => {
          return new Date(fileB.timestamp) - new Date(fileA.timestamp)
        }).sort((fileA, fileB) => {
          return FileState.getStatePriority(fileA.state, fileA.stateMessage) - FileState.getStatePriority(fileB.state, fileB.stateMessage)
        })
    }
  }
}
</script>

<style lang="scss">
  .landing {
    &__file-wrapper {
      height: 100% !important;
      padding-top: $default-padding-margin !important;
      background: rgb(19, 21, 37);
    }
    &__tab-wrapper {
      padding-bottom: $default-padding-margin;
    }
  }
</style>
