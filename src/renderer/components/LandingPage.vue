<template>
  <div id="wrapper-landing-page" :class="{ 'drag-active': isDragging && streams && streams.length > 0}" @dragenter="handleDrag" @dragover="handleDrag" @drop.prevent="handleDrop"
     @dragover.prevent @dragleave="outDrag">
    <section class="main-content columns is-mobile">
      <side-navigation :class="{ 'side-menu__with-progress': shouldShowProgress}"></side-navigation>
      <div class="column content is-desktop" v-if="streams && streams.length > 0">
        <empty-stream v-if="isEmptyStream()"></empty-stream>
        <file-container v-else :isDragging="isDragging" @onImportFiles="handleFiles"></file-container>
      </div>
      <div class="column content is-desktop" v-else>
        <empty-stream v-if="isEmptyStream()"></empty-stream>
        <file-container v-else :isDragging="isDragging" @onImportFiles="handleFiles"></file-container>
      </div>
    </section>
    <global-progress></global-progress>
    <confirm-alert
      :title="alertTitle"
      :content="alertContent"
      :image="'rfcx-logo.png'"
      :isProcessing="false"
      v-if="isPopupOpened"
      @onCancelPressed="cancel()"/>
  </div>
</template>

<script>
  import GlobalProgress from './SideNavigation/GlobalProgress'
  import SideNavigation from './SideNavigation/SideNavigation'
  import EmptyStream from './LandingPage/EmptyStream'
  import FileContainer from './LandingPage/FileContainer/FileContainer'
  import ConfirmAlert from './Common/ConfirmAlert'
  import { mapState } from 'vuex'
  import File from '../store/models/File'
  import Stream from '../store/models/Stream'
  import Analytics from 'electron-ga'
  const { remote } = window.require('electron')

  export default {
    name: 'landing-page',
    components: { SideNavigation, EmptyStream, FileList, FileContainer, GlobalProgress, ConfirmAlert },
    data () {
      return {
        uploadingProcessText: 'The uploading process has been paused',
        alertTitle: 'You are up to date',
        alertContent: this.getContent(),
        executed: false,
        isDragging: false,
        isPopupOpened: false
      }
    },
    methods: {
      outDrag (e) {
        // FIX dropleave event
        // e.preventDefault()
        this.isDragging = false
      },
      handleDrag (e) {
        // console.log('handleDrag -- side', e)
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
      },
      handleFiles (files) {
        this.isDragging = false
        if (!files) { return }
        // reset selected tab
        const tabObject = {}
        tabObject[this.selectedStreamId] = 'Prepared'
        this.$store.dispatch('setSelectedTab', tabObject)
        this.$file.handleDroppedFiles(files, this.selectedStream)
      },
      isEmptyStream () {
        return this.streams === undefined || this.streams.length === 0
      },
      async sendVersionOfApp () {
        let version = remote.getGlobal('version')
        let guid = remote.getGlobal('userId')
        const analytics = new Analytics('UA-38186431-15', { appName: 'RFCx Ingest', appVersion: `${version}`, clientId: `${guid}` })
        await analytics.send('screenview', { cd: `${guid}`, 'an': 'RFCx Ingest', 'av': `${version}`, 'cid': `${guid}` })
        await analytics.send('event', { ec: `${guid}`, 'ea': `${new Date().toLocaleString()}`, 'an': 'RFCx Ingest', 'av': `${version}`, 'cid': `${guid}` })
        console.log('analytics', analytics)
      },
      cancel () {
        this.isPopupOpened = false
      },
      getContent () {
        return `You are on the latest version ${remote.getGlobal('version')}`
      }
    },
    computed: {
      ...mapState({
        selectedStreamId: state => state.Stream.selectedStreamId,
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
      this.$electron.ipcRenderer.on('showUpToDatePopup', (event, message) => {
        this.isPopupOpened = message
      })
    }
  }
</script>

<style lang="scss">

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
    background-color: $dropdown-content-background-color;
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

  .field {
    margin-bottom: 1rem !important;
  }

  .button.is-primary {
    font-weight: $title-font-weight;
  }

  .uploading-process-status {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
    text-align: center;
    background-color: $progress-bar-background-color;
    font-size: $default-font-size;
  }

  .alert .modal-card-body {
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    font-size: $alert-content-size;
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

  .modal-card-head,
  .modal-card-body,
  .modal-card-foot {
    background-color: #292a3b !important;
  }
  .modal-card-title {
    color: white !important;
  }
  .active {
    border: 4px solid #131525 !important;
    background-color: #131525 !important;
    opacity: 0.8 !important;
  }
  .is-cancel:hover {
    border-color: $button-hover-border-color !important;
    color: #fff !important;
    background: $button-hover-border-color !important;
  }
  .empty {
    background-color: #131525 !important;
  }
  .state-progress span {
    color: $body-text-color;
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
