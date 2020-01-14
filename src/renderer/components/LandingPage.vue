<template>
  <div id="wrapper-landing-page" class="has-fixed-sidebar" :class="{ 'dark-mode': isDarkTheme === true }">
    <div v-if="hasAccessToApp()">
      <navigation :class="{ 'dark-mode': isDarkTheme === true }"></navigation>
      <section class="main-content columns is-mobile">
        <side-navigation :class="{ 'dark-mode': isDarkTheme === true }"></side-navigation>
        <div class="column content is-desktop" v-if="streams && streams.length > 0" :class="{ 'dark-mode': isDarkTheme === true  }">
          <empty-stream v-if="isEmptyStream()"></empty-stream>
          <file-list v-else></file-list>
        </div>
        <div class="column content is-desktop" v-else @drop.prevent="handleDrop" @dragover.prevent :class="{ 'dark-mode': isDarkTheme === true }">
          <empty-stream v-if="isEmptyStream()"></empty-stream>
          <file-list v-else></file-list>
        </div>
      </section>
      <footer class="uploading-process-status" :class="{ 'dark-mode': isDarkTheme === true }" v-if="!isUploadingProcessEnabled"
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
  import settings from 'electron-settings'
  import Stream from '../store/models/Stream'
  import fileHelper from '../../../utils/fileHelper'
  import Analytics from 'electron-ga'
  const { remote } = window.require('electron')

  export default {
    name: 'landing-page',
    components: { Navigation, SideNavigation, EmptyStream, FileList },
    data () {
      return {
        uploadingProcessText: 'The uploading process has been paused',
        executed: false,
        darkTheme: settings.get('settings.darkMode')
      }
    },
    methods: {
      handleDrop (e) {
        console.log('e', e)
        let dt = e.dataTransfer
        let files = dt.files
        this.handleFiles(files)
      },
      handleFiles (files) {
        let arrPath = []
        this.isDragging = false
        if (files && files.length === 1) {
          ([...files]).forEach((file) => {
            if (fileHelper.isFolder(file.path)) {
              console.log('file', file)
              this.$router.push({ path: '/add', query: { folderPath: file.path, name: fileHelper.getFileNameFromFilePath(file.path) } })
            }
          })
        } else if (files && files.length > 1) {
          ([...files]).forEach((file) => {
            if (fileHelper.isFolder(file.path)) {
              console.log('file', file)
              arrPath.push(file.path)
            }
          })
          if (arrPath && arrPath.length) {
            this.$router.push({ path: '/add', query: { folderPaths: arrPath } })
          }
        }
      },
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
        if (hasAccessToApp && !this.executed) {
          // For the first enter to the app for continue the uploading process
          console.log('hasAccessToApp on the first enter', hasAccessToApp)
          this.executed = true
          this.$store.dispatch('setUploadingProcess', true)
          return true
        } else if (hasAccessToApp && this.executed) {
          console.log('hasAccessToApp', hasAccessToApp)
          return true
        } else {
          console.log('hasAccessToApp', hasAccessToApp)
          this.$router.push('/access-denied-page')
          this.$electron.ipcRenderer.send('removeTray')
          this.$store.dispatch('setUploadingProcess', false)
        }
      },
      async sendVersionOfApp () {
        let version = remote.getGlobal('version')
        let guid = remote.getGlobal('userId')
        const analytics = new Analytics('UA-38186431-15', { appName: 'RFCx Ingest', appVersion: `${version}`, clientId: `${guid}` })
        await analytics.send('screenview', { cd: `${guid}` })
        await analytics.send('event', { ec: `${guid}`, 'ea': `${new Date().toLocaleString()}` })
        console.log('analytics', analytics)
      }
    },
    computed: {
      ...mapState({
        isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess
      }),
      streams () {
        return Stream.all()
      },
      isDarkTheme () {
        let darkMode = settings.get('settings.darkMode')
        let listener = (event, arg) => {
          this.$electron.ipcRenderer.removeListener('switchDarkMode', listener)
          darkMode = arg
          console.log('darkMode from listener', darkMode)
          this.darkTheme = darkMode
          return darkMode
        }
        this.$electron.ipcRenderer.on('switchDarkMode', listener)
        console.log('darkMode from initial settings', darkMode, 'darkTheme', this.darkTheme)
        if (darkMode === true) return true
        else return false
      }
    },
    created () {
      console.log('view loaded')
      let html = document.getElementsByTagName('html')[0]
      html.style.overflowY = 'auto'
      this.sendVersionOfApp()
    }
  }
</script>

<style lang="scss">

  html {
    overflow: hidden;
    background-color: white;
    color: #000;
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
    display: inline-block;
    vertical-align: middle;
  }

  .user-info-image {
    margin: auto;
    text-align: center;
    height: 30px;
    max-width: 30px;
    max-height: 30px;
    width: 30px;
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
    background-color: white;
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
    align-items: center;
  }

  .menu-container svg {
    margin-left: auto;
    margin-right: 3px;
  }

  .menu-container-failed {
    margin-right: 4px;
  }

  .menu-container-failed img {
    width: 16px;
    height: 16px;
    margin-left: 5px;
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
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .progress {
    margin: 0.5rem auto !important;
    height: 6px !important;
  }

  .state-progress span {
    color: $body-text-color;
  }

  a.is-circle {
    background-color: transparent;
    border-color: transparent;
    border-radius: 50%;
    margin: auto;
    text-align:center;
    position: fixed;
    right: 4.2em;
    bottom: 2em;
    padding: 3px !important;
    margin: 0 1px !important;
    &:active,
    &:hover,
    &:focus {
      border-color: transparent !important;
    }
    img {
      height: 32px;
      width: 32px;
    }
  }

  .btn-extirnal-link {
    right: 2em !important;
    cursor: pointer;
    &:active,
    &:hover,
    &:focus {
      border-color: transparent !important;
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

  .dark-mode {
    background-color: #131525 !important;
    color: #fff !important;
    .navbar-item {
      color: white;
    }
    .stream-title {
      color: white;
    }
    .menu-item:hover {
      background-color: #292a3b;
    }
    .iconRedo {
      color: #ccc;
    }
    .iconHide {
      color: #ccc;
      font-size: 14px;
    }
    .dropdown-content {
      background-color: #292a3b;
    }
    .dropdown-item {
      color: white;
    }
    .dropdown-item:hover {
      background-color: #45485d !important;
      color: white;
    }
    .modal-card-body,
    .modal-card-foot {
      background-color: #292a3b !important;
    }
    .modal-card-title {
      color: white !important;
    }
    .table {
      background-color: #131525;
      color: white;
    }
    table td {
      border-color: #292a3b;
      border-width: 0 0 2px !important;
    }
    .content table td, .content table th {
      border: 1px solid #45485d;
    }
    table tr:hover {
      background-color: #292a3b !important;
    }
    .table thead td {
      color: white !important;
      opacity: 1;
    }
    .title-container-edit {
      color: white;
    }
    .is-error {
      color: #ccc;
    }
    .active {
      border: 4px solid #131525 !important;
      background-color: #131525 !important;
      opacity: 0.8 !important;
    }
    .edit-container-item-input {
      color: #fff !important;
      background-color: #292a3b !important;
      border-color: #292a3b !important;
    }
    .btn-edit-cancel {
      background: #45485d;
      border-color: #45485d;
      color: #fff;
    }
    .btn-edit-cancel:hover {
      border-color: #3b3e53;
      color: #fff;
      background: #3b3e53;
    }
    .empty {
      background-color: #131525 !important;
    }
    .state-progress span {
      color: $body-text-color-dark;
    }
    ::-webkit-scrollbar-thumb {
      background-color: #45485d;
    }
    ::-webkit-scrollbar-track {
      background-color: #52566e;
    }
    ::-webkit-scrollbar {
      width: 3px;
    }
  }

</style>
