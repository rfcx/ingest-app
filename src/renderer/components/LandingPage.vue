<template>
  <div id="wrapper-landing-page" class="has-fixed-sidebar" :class="{ 'dark-mode': isDarkTheme === true }">
    <div v-if="hasAccessToApp()">
      <!-- <navigation :class="{ 'dark-mode': isDarkTheme === true }"></navigation> -->
      <section class="main-content columns is-mobile">
        <side-navigation :class="{ 'dark-mode': isDarkTheme, 'dark-aside': isDarkTheme , 'side-menu__with-progress': shouldShowProgress}"></side-navigation>
        <div class="column content is-desktop" v-if="streams && streams.length > 0" @dragover="onDragOver($event)" :class="{ 'dark-mode': isDarkTheme === true  }">
          <empty-stream v-if="isEmptyStream()"></empty-stream>
          <!-- <file-list v-else></file-list> -->
          <file-container v-else></file-container>
        </div>
        <div class="column content is-desktop" v-else @drop.prevent="handleDrop" @dragover.prevent :class="{ 'dark-mode': isDarkTheme === true }">
          <empty-stream v-if="isEmptyStream()"></empty-stream>
          <!-- <file-list v-else></file-list> -->
          <file-container v-else></file-container>
        </div>
      </section>
      <global-progress></global-progress>
    </div>
  </div>
</template>

<script>
  import GlobalProgress from './SideNavigation/GlobalProgress'
  import Navigation from './Navigation/Navigation'
  import SideNavigation from './SideNavigation/SideNavigation'
  import EmptyStream from './LandingPage/EmptyStream'
  import FileList from './LandingPage/FileList'
  import FileContainer from './LandingPage/FileContainer/FileContainer'
  import { mapState } from 'vuex'
  import settings from 'electron-settings'
  import File from '../store/models/File'
  import Stream from '../store/models/Stream'
  import fileHelper from '../../../utils/fileHelper'
  import Analytics from 'electron-ga'
  const { remote } = window.require('electron')

  export default {
    name: 'landing-page',
    components: { Navigation, SideNavigation, EmptyStream, FileList, FileContainer, GlobalProgress },
    data () {
      return {
        uploadingProcessText: 'The uploading process has been paused',
        executed: false,
        darkTheme: settings.get('settings.darkMode')
      }
    },
    // watch: {
    //   streams (newStreams, oldStreams) {
    //     console.log('watch streams changes')
    //     try {
    //       let strms = newStreams.filter((newStream) => {
    //         return !oldStreams.find((oldStream) => {
    //           return oldStream.id === newStream.id
    //         })
    //       })
    //       if (strms && strms.length) {
    //         console.log('subscribe new streams!!!!', strms)
    //         this.$electron.ipcRenderer.send('subscribeToFileWatcher', strms)
    //       }
    //     } catch (e) { }
    //   }
    // },
    methods: {
      onDragOver (e) {
        e.preventDefault()
        e.dataTransfer.effectAllowed = 'uninitialized'
        e.dataTransfer.dropEffect = 'none'
      },
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
          // this.$store.dispatch('setUploadingProcess', true)
          return true
        } else if (hasAccessToApp && this.executed) {
          console.log('hasAccessToApp', hasAccessToApp)
          return true
        } else {
          console.log('hasAccessToApp', hasAccessToApp)
          this.$router.push('/access-denied-page')
          this.$electron.ipcRenderer.send('removeTray')
          // this.$store.dispatch('setUploadingProcess', false)
        }
      },
      async sendVersionOfApp () {
        let version = remote.getGlobal('version')
        let guid = remote.getGlobal('userId')
        const analytics = new Analytics('UA-38186431-15', { appName: 'RFCx Ingest', appVersion: `${version}`, clientId: `${guid}` })
        await analytics.send('screenview', { cd: `${guid}`, 'an': 'RFCx Ingest', 'av': `${version}`, 'cid': `${guid}` })
        await analytics.send('event', { ec: `${guid}`, 'ea': `${new Date().toLocaleString()}`, 'an': 'RFCx Ingest', 'av': `${version}`, 'cid': `${guid}` })
        console.log('analytics', analytics)
      },
      subscribeForFileChanges (stream) {
        let streams = stream ? [ stream ] : this.streams
        this.$electron.ipcRenderer.send('subscribeToFileWatcher', streams)
      }
    },
    computed: {
      ...mapState({
        isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess
      }),
      streams () {
        return Stream.all()
      },
      shouldShowProgress () {
        return this.uploadingFiles.length > 0
      },
      uploadingFiles () {
        const files = File.all()
        return files.filter(f => f.state === 'uploading')
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
      let isDark = settings.get('settings.darkMode')
      if (html && isDark) {
        html.style.backgroundColor = '#131525'
      }
      this.sendVersionOfApp()
      // settings.set('settings.production_env', true)
      this.subscribeForFileChanges()
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
    width: $sidebar-width !important;
    padding: 0 !important;
    margin-right: $default-padding-margin;
    top: $navbar-height;
    bottom: 0;
    position: absolute;
    &__with-progress {
      margin-bottom: $global-progress-height;
    }
  }

  .side-menu-column {
    padding-top: 20px !important;
  }

  .content {
    position: absolute;
    top: $navbar-height;
    padding: 0 !important;
    bottom: 0;
    left: $sidebar-width;
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
    justify-content: space-between;
    align-self: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .menu-container svg {
    margin-left: auto !important;
    margin-right: 3px;
  }

  .menu-container-failed {
    margin-right: 4px;
  }

  .menu-container-failed img {
    width: 16px !important;
    height: 16px !important;
    margin-left: 5px;
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
    font-family: Avenir;
    font-size: 14px !important;
    font-weight: 900 !important;
    font-stretch: normal;
    font-style: normal;
    line-height: normal !important;
    letter-spacing: normal !important;
    margin-right: 3px;
    align-self: center;
  }

  .progress {
    margin: 4px auto !important;
    height: 3px !important;
  }

  .state-progress span {
    color: $body-text-color;
  }

  a.is-circle {
    background-color: transparent;
    border-color: transparent;
    border-radius: 50%;
    margin: auto;
    text-align: center;
    padding: 0 0 0 3px !important;
    margin: 0 0 0 1px !important;
    &:active,
    &:hover,
    &:focus {
      border-color: transparent !important;
    }
    .img-open-folder {
      height: 25px !important;
      width: 25px !important;
      padding: 0 !important;
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
    padding: 0 !important;
    padding-top: 20px !important;
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

    .stream-info-container {
      background: #fff;
    }
    .file-list-table__head {
      background-color: #fff !important;
    }
  }

  .dark-mode {
    background-color: #131525 !important;
    color: #fff !important;
    aside {
      background-color: #232436 !important;
    }
    .navbar-item {
      color: white;
    }
    .stream-title {
      color: white;
    }
    .menu-item:hover,
    .menu-item_active {
      background-color: #2e3145 !important;
    }
    .iconRedo {
      color: #ccc;
    }
    .iconHide {
      color: #ccc;
      font-size: 14px;
    }
    .dropdown-content {
      background-color: #232436;
    }
    .dropdown-item {
      color: white;
    }
    .dropdown-item:hover {
      background-color: #2e3145 !important;
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
    .stream-info-container {
      background-color: #131525;
    }
    .file-list-table__head {
      background-color: #131525 !important;
    }
    .modal.is-active {
      z-index: 200;
    }
    .modal-background {
      z-index: 150;
    }
    .modal-card {
      z-index: 200;
    }
    ::-webkit-scrollbar-thumb {
      background-color: gray;
    }
    ::-webkit-scrollbar-track {
      background-color: #52566e;
    }
    ::-webkit-scrollbar {
      width: 6px;
    }
  }

</style>
