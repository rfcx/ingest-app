<template>
  <div class="landing-file__file-wrapper">
    <header-view></header-view>
    <tab></tab>
    <!-- TODO: if selected tab is prepared => show format info  -->
    <file-name-format-info></file-name-format-info>
    <file-list></file-list>
  </div>
</template>

<script>
import HeaderView from '../HeaderView'
import Tab from './Tab'
import FileNameFormatInfo from './FileNameFormatInfo'
import FileList from './FileList'

export default {
  components: {
    HeaderView, Tab, FileNameFormatInfo, FileList
  }
}
</script>