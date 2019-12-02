<template>
  <div id="wrapper-landing-page" class="has-fixed-sidebar">
    <div v-if="hasAccessToApp()">
      <navigation></navigation>
      <section class="main-content columns is-mobile">
        <side-navigation></side-navigation>
        <div class="column content is-desktop">
          <empty-stream v-if="isEmptyStream()"></empty-stream>
          <file-list v-else></file-list>
        </div>
      </section>
      <footer class="uploading-process-status" v-if="!isUploadingProcessEnabled"
        @mouseover="uploadingProcessText = 'Tap here to resume the uploading process'"
        @mouseleave="uploadingProcessText = 'The uploading process has been paused'"
        @click="resumeUploadingProcess()">
        <span>
          {{ uploadingProcessText }}
        </span>
      </footer>
    </div>
  </div>
</template>

<script>
  import Navigation from './Navigation/Navigation'
  import SideNavigation from './SideNavigation/SideNavigation'
  import EmptyStream from './LandingPage/EmptyStream'
  import FileList from './LandingPage/FileList'
  import { mapState } from 'vuex'
  import Stream from '../store/models/Stream'
  const { remote } = window.require('electron')

  export default {
    name: 'landing-page',
    components: { Navigation, SideNavigation, EmptyStream, FileList },
    data () {
      return {
        uploadingProcessText: 'The uploading process has been paused'
      }
    },
    methods: {
      isEmptyStream () {
        return this.streams === undefined || this.streams.length === 0
      },
      pauseUploadingProcess () {
        this.$store.dispatch('setUploadingProcess', false)
      },
      resumeUploadingProcess () {
        this.$store.dispatch('setUploadingProcess', true)
      },
      hasAccessToApp () {
        let hasAccessToApp = remote.getGlobal('hasAccessToApp')
        console.log('hasAccessToApp', hasAccessToApp)
        if (hasAccessToApp) {
          this.$store.dispatch('setUploadingProcess', true)
          return true
        } else {
          this.$router.push('/access-denied-page')
          this.$electron.ipcRenderer.send('removeTray')
          this.$store.dispatch('setUploadingProcess', false)
        }
      }
    },
    computed: {
      ...mapState({
        selectedStreamId: state => state.Stream.selectedStreamId,
        isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess
      }),
      streams () {
        return Stream.all()
      },
      selectedStream () {
        return Stream.find(this.selectedStreamId)
      }
    },
    created () {
      console.log('view loaded')
    }
  }
</script>

<style lang="scss">

  html {
    overflow: hidden;
  }

  html.has-navbar-fixed-top, body.has-navbar-fixed-top {
    padding-top: $navbar-height;
  }

  .navbar {
    padding: 0 $default-padding-margin;
  }

  .navbar-brand span {
    font-weight: $title-font-weight;
  }

  .navbar-item.tag {
    margin: auto 0 !important;
  }

  .user-info-nav {
    text-align: right;
  }

  .user-info-nav .name {
    font-weight: $title-font-weight;
  }

  .user-info-name {
    padding: 1rem;
  }

  .user-info-image {
    margin: auto;
  }

  #wrapper-landing-page {
    background-color: #fdfdfd;
    padding: 0;
    position: absolute;
    top: $navbar-height;
    bottom: 0;
    left: 0;
    right: 0;
  }

  #wrapper-landing-page.has-fixed-sidebar {
    overflow: hidden;
    position: inherit;
  }

  #wrapper-landing-page {
    overflow: auto;
    overflow-y: auto;
  }

  #wrapper-landing-page.has-fixed-sidebar {
    overflow: hidden;
  }

  .main-content {
    padding: 0 $default-padding-margin;
  }

  .column {
    overflow-y: auto;
  }

  .side-menu {
    flex: none;
    width: 250px !important;
    padding: $default-padding-margin 0;
    margin-right: $default-padding-margin;
    top: $navbar-height;
    bottom: 0;
    position: absolute;
  }

  .content {
    position: absolute;
    top: $navbar-height;
    bottom: 0;
    left: 250px;
    right: 0;
  }

  ::-webkit-scrollbar {
    width: 4px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  ::-webkit-scrollbar-thumb {
    background: $grey-lighter;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: $grey-lighter;
  }

  .menu {
    background-color: #fff;
  }

  .menu-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .menu-container-failed {
    margin-right: 4px;
  }

  .menu-container-failed img {
    width: 16px;
    height: 16px;
  }

  .side-menu-title {
    padding: 0 $default-padding-margin;
  }

  .side-menu-controls-wrapper {
    margin-right: 4px;
  }

  .side-menu-controls-btn {
    width: 17px;
    height: 17px;
  }

  .menu .menu-item {
    padding: $default-padding-margin;
  }

  .menu .menu-item:hover {
    background-color: #fafafa;
  }

  .menu div.is-active {
    border-left: 0.35em solid $brand-primary;
    background-color: transparent;
    padding-left: 0.4em;
  }

  .menu div.is-active .stream-title {
    font-weight: $title-font-weight;
  }

  .menu .stream-title {
    color: $title-text-color;
  }

  .progress {
    margin: 0.5rem auto !important;
    height: 0.5rem;
  }

  .state-progress span {
    color: $body-text-color;
  }

  a.is-circle {
    height: 60px;
    width: 60px;
    background-color: #fff;
    border-color: #fff;
    border-radius: 50%;
    margin: auto;
    text-align:center;
    position: fixed;
    right: 2em;
    bottom: 2em;
    &:active,
    &:hover,
    &:focus {
      border-color: #fff;
    }
  }

  .field {
    margin-bottom: 1rem !important;
  }

  .button.is-primary {
    font-weight: $title-font-weight;
  }

  .tray-container {
    height: 300px;
  }

  .tray-menu {
    height: 300px;
  }

  .uploading-process-status {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
    text-align: center;
    background-color: $progress-bar-background-color;
    font-size: 0.75rem;
  }

  .alert .modal-card-body {
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
  }

  @media screen and (min-width: 400px) {

    .navbar-end {
      justify-content: flex-end;
      margin-left: auto;
    }

    .navbar, .navbar-menu, .navbar-start, .navbar-end {
      align-items: stretch;
      display: flex;
    }

    .navbar-item {
      display: flex;
    }

  }

</style>
