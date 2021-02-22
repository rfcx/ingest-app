<template>
  <div id="wrapper-landing-page" :class="{ 'drag-active': isDragging }" @dragenter="handleDrag" @dragover="handleDrag" @drop.prevent="handleDrop"
     @dragover.prevent @dragleave="outDrag">
    <!-- <section class="main-content columns is-mobile"> -->
      <div class="dropdown dropdown__wrapper" :class="{ 'is-active': shouldShowNewSiteDropDown }">
        <div class="dropdown-menu dropdown__menu" id="dropdown-menu-for-new-site" role="menu">
          <div class="dropdown-content dropdown__content">
            <router-link title="Create new site" to="/add"><a href="#" class="dropdown-item">Create new site</a></router-link>
            <router-link title="Import files" to="/import"><a href="#" class="dropdown-item">Import files</a></router-link>
          </div>
        </div>
      </div>
      <side-navigation 
        :class="{ 'side-menu__with-progress': shouldShowProgress}" 
        @clickNewSiteButton="toggleNewSiteDropDown" 
        @clickOutSideNewSiteButton="hideNewSiteDropDown"
      />
      <div class="column content is-desktop">
        <empty-view v-if="isEmptyStream()" :isEmptyStream="isEmptyStream()"></empty-view>
        <file-container v-else :isDragging="isDragging" @onImportFiles="handleFiles"></file-container>
      </div>
    <!-- </section> -->
    <global-progress ref="globalProgress"></global-progress>
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
  import EmptyView from './LandingPage/EmptyView'
  import FileContainer from './LandingPage/FileContainer/FileContainer'
  import ConfirmAlert from './Common/ConfirmAlert'
  import { mapState } from 'vuex'
  import Stream from '../store/models/Stream'
  import Analytics from 'electron-ga'
  import env from '../../../env.json'
  const { remote } = window.require('electron')
  const log = require('electron-log')
  console.log = log.log

  export default {
    name: 'landing-page',
    components: { SideNavigation, EmptyView, FileList, FileContainer, GlobalProgress, ConfirmAlert },
    data () {
      return {
        alertTitle: 'You are up to date',
        alertContent: this.getContent(),
        executed: false,
        isDragging: false,
        isPopupOpened: false,
        shouldShowNewSiteDropDown: false
      }
    },
    methods: {
      outDrag (e) {
        // FIX dropleave event
        // e.preventDefault()
        this.isDragging = false
      },
      handleDrag (e) {
        this.isDragging = true
      },
      onDragOver (e) {
        e.preventDefault()
        e.dataTransfer.effectAllowed = 'uninitialized'
        e.dataTransfer.dropEffect = 'none'
      },
      async handleDrop (e) {
        const t0 = performance.now()
        await this.handleFiles(e.dataTransfer.files)
        const t1 = performance.now()
        console.log('[Measure] handleDrop ' + (t1 - t0) + ' ms')
      },
      async handleFiles (files) {
        this.isDragging = false
        if (!files) { return }
        if (!(this.streams && this.streams.length > 0)) { // create new streams with files
          const fileObjects = [...files].map(file => {
            return {
              'lastModified': file.lastModified,
              'lastModifiedDate': file.lastModifiedDate,
              'name': file.name,
              'size': file.size,
              'type': file.type,
              'path': file.path
            }
          })
          this.$router.push({path: '/add', query: { selectedFiles: JSON.stringify(fileObjects) }})
          return
        }
        // reset selected tab
        await this.$store.dispatch('setSelectedTab', { [this.selectedStreamId]: 'Prepared' })
        await this.$file.handleDroppedFiles(files, this.selectedStream)
      },
      isEmptyStream () {
        return this.streams === undefined || this.streams.length === 0
      },
      async sendVersionOfApp () {
        let version = remote.getGlobal('version')
        let guid = remote.getGlobal('userId')
        const analytics = new Analytics(env.analytics.id, { appName: env.analytics.appName, appVersion: `${version}`, clientId: `${guid}` })
        await analytics.send('screenview', { cd: `${guid}`, 'an': env.analytics.appName, 'av': `${version}`, 'cid': `${guid}` })
        await analytics.send('event', { ec: `${guid}`, 'ea': `${new Date().toLocaleString()}`, 'an': env.analytics.appName, 'av': `${version}`, 'cid': `${guid}` })
      },
      cancel () {
        this.isPopupOpened = false
      },
      getContent () {
        return `You are on the latest version ${remote.getGlobal('version')}`
      },
      toggleNewSiteDropDown () {
        this.shouldShowNewSiteDropDown = !this.shouldShowNewSiteDropDown
      },
      hideNewSiteDropDown () {
        this.shouldShowNewSiteDropDown = false
      },
      migrateDatabase () {
        // vuex migration
        const selectedStreamIdInAppSettingModel = this.$store.state.AppSetting.selectedStreamId
        const selectedStreamIdInStreamModel = this.$store.state.Stream.selectedStreamId
        if (!selectedStreamIdInAppSettingModel && selectedStreamIdInStreamModel) {
          this.$store.dispatch('setSelectedStreamId', selectedStreamIdInStreamModel)
        }
      }
    },
    computed: {
      ...mapState({
        selectedStreamId: state => state.AppSetting.selectedStreamId,
        currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId
      }),
      streams () {
        return Stream.all()
      },
      selectedStream () {
        return Stream.find(this.selectedStreamId)
      },
      shouldShowProgress () {
        return this.$refs.globalProgress && this.$refs.globalProgress.shouldShowProgress
      }
    },
    created () {
      this.migrateDatabase()
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
    background-color: $side-menu-background;
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

  .dropdown {
    &__wrapper {
      top: 95px;
      left: 1.5em;
      border: 1px solid rgba($divider-color, 0.5);
    }
    &__menu {
      width: 220px;
    }
    &__content {
      border: 1px solid rgba($divider-color, 0.5);
    }
  }

  a.dropdown-item {
    font-size: $default-font-size;
    padding: 0.75rem 1rem;
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
