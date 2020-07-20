<template>
  <div id="wrapper-landing-page" :class="{ 'drag-active': isDragging && streams && streams.length > 0}" @dragenter="handleDrag" @dragover="handleDrag" @drop.prevent="handleDrop"
     @dragover.prevent @dragleave="outDrag">
    <div v-if="hasAccessToApp()">
      <!-- <navigation :class="{ 'dark-mode': isDarkTheme === true }"></navigation> -->
      <section class="main-content columns is-mobile">
        <side-navigation :class="{ 'side-menu__with-progress': shouldShowProgress}"></side-navigation>
        <div class="column content is-desktop" v-if="streams && streams.length > 0">
          <empty-stream v-if="isEmptyStream()"></empty-stream>
          <!-- <file-list v-else></file-list> -->
          <file-container v-else :isDragging="isDragging"></file-container>
        </div>
        <div class="column content is-desktop" v-else>
          <empty-stream v-if="isEmptyStream()"></empty-stream>
          <!-- <file-list v-else></file-list> -->
          <file-container v-else :isDragging="isDragging"></file-container>
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
        isDragging: false
      }
    },
    methods: {
      outDrag (e) {
        // FIX dropleave event
        // e.preventDefault()
        this.isDragging = false
      },
      handleDrag (e) {
        console.log('handleDrag -- side', e)
        this.isDragging = true
      },
      onDragOver (e) {
        console.log('onDragOver', e)
        e.preventDefault()
        e.dataTransfer.effectAllowed = 'uninitialized'
        e.dataTransfer.dropEffect = 'none'
      },
      handleDrop (e) {
        console.log('handleDrop', e)
        let dt = e.dataTransfer
        let files = dt.files
        this.handleFiles(files)
        const tabObject = {}
        tabObject[this.selectedStreamId] = 'Prepared'
        this.$store.dispatch('setSelectedTab', tabObject)
      },
      handleFiles (files) {
        console.log('handleFiles', files)
        this.isDragging = false
        // let subfolder = []
        if (!files) { return } // no files
        ([...files]).forEach(file => {
          if (fileHelper.isFolder(file.path)) {
            this.handleFolder(file)
          } else {
            this.saveFile(file)
          }
        })
      },
      handleFolder (folder) {
        // see all stuff in the directory
        const stuffInDirectory = fileHelper.getFilesFromDirectoryPath(folder.path).map(name => {
          return { name: name, path: folder.path + '/' + name }
        })
        // get the files in the directory
        const files = stuffInDirectory.filter(file => !fileHelper.isFolder(file.path))
        console.log(`stuffInDirectory ${stuffInDirectory}`)
        // save files to the db
        files.forEach(file => {
          this.saveFile(file)
        })
        // get subfolders
        const subfolders = stuffInDirectory.filter(file => fileHelper.isFolder(file.path))
        subfolders.forEach(folder => this.handleFolder(folder))
      },
      saveFile (file) {
        this.$file.newFilePath(file.path, this.selectedStream)
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
      }
    },
    computed: {
      ...mapState({
        selectedStreamId: state => state.Stream.selectedStreamId,
        isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess,
        currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId
      }),
      streams () {
        return Stream.all()
      },
      selectedStream () {
        return Stream.find(this.selectedStreamId)
      },
      allFilesInTheSession () {
        return File.query().where('sessionId', this.currentUploadingSessionId).get()
      },
      shouldShowProgress () {
        const allFiles = this.allFilesInTheSession
        return allFiles.length !== allFiles.filter(file => file.isInCompletedGroup).length
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
    padding: 0;
    position: absolute;
    top: $navbar-height;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: auto;
    overflow-y: auto;
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

  aside {
    background-color: #232436;
  }

  .content {
    position: absolute;
    top: $navbar-height;
    padding: 0 !important;
    bottom: 0;
    left: $sidebar-width;
    right: 0;
  }

  ::-webkit-scrollbar {
    width: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: $grey-lighter;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: $grey-lighter;
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
    color: $body-text-color;
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

  .drag-active {
    border: 2px solid #cac5c5 !important;
    background-color: #cac5c5 !important;
    opacity: 0.5 !important;
  }

</style>
