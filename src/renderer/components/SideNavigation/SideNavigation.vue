<template>
  <aside class="column menu side-menu side-menu-column wrapper">
    <div class="wrapper__header">
      <div class="wrapper__logo">
        <router-link to="/"><img src="~@/assets/rfcx-logo.png" alt="rfcx" class="icon-logo"></router-link>
        <span class="is-size-7">{{ !isProductionEnv() ? 'staging' : '' }}</span>
      </div>
      <div lass="wrapper__user-pic" v-click-outside="hide" @click="toggleUserMenu()">
        <img title="Menu" class="user-pic" :src="getUserPicture()" alt="" @error="$event.target.src=require(`../../assets/ic-profile-temp.svg`)">
      </div>
    </div>
    <div class="wrapper__stat" v-if="showUserMenu">
      <div class="wrapper__user-name">
        <span>{{ userName }}</span>
        <button class="button is-small is-rounded" @click.prevent="showPopupToLogOut()">Log out</button>
      </div>
    </div>
    <div class="menu-container wrapper__controls">
      <button type="button" class="button is-rounded rounded-button" @click="showDropDownMenu" v-click-outside="hideDropDownMenu">
        <span>+</span>Upload Audio
      </button>
    </div>
    <div class="wrapper__title">
      <span>
        Sites
        <div class="wrapper__loader">
          <fa-icon class="iconRefresh" :icon="iconRefresh" @click.prevent="fetchUserSites()" v-if="!isFetching"></fa-icon>
          <div class="loader" v-if="isFetching"></div>
        </div>
      </span>
    </div>
    <div v-if="toggleSearch" class="wrapper__search" :class="{ 'search-wrapper_red': isRequiredSymbols }">
      <input type="text" class="input wrapper__input" placeholder="Filter" v-model="searchStr"
        @keyup="onKeyUp($event)" ref="searchStream">
      <button title="Remove search text" class="btn-remove" @click="onRemoveSearchText()"
        :class="{ 'btn-remove-active': searchStr }">
        <img src="~@/assets/ic-remove.svg">
      </button>
    </div>
    <ul>
      <li v-for="stream in streams" :key="stream.id">
        <div class="wrapper__stream-row" v-on:click="selectItem(stream)" :class="{'wrapper__stream-row_active': isActive(stream)}">
          <div class="menu-container" :class="{ 'menu-container-failed': stream.state === 'failed' || stream.state && stream.state.includes('error') }">
            <div class="wrapper__stream-name">{{ stream.name }}</div>
            <fa-icon class="iconRedo" v-if="stream.canRedo" :icon="iconRedo" @click="repeatUploading(stream.id)"></fa-icon>
            <img :src="getStateImgUrl(getState(stream))">
          </div>
        </div>
      </li>
    </ul>
    <confirm-alert
      :title="alertTitle"
      :content="alertContent"
      confirmButtonText="Log Out"
      :isProcessing="false"
      v-if="showConfirmToLogOut"
      @onCancelPressed="hidePopupToLogOut()"
      @onConfirmPressed="logOut()"/>
  </aside>
</template>

<script>
  import fileState from '../../../../utils/fileState'
  import streamHelper from '../../../../utils/streamHelper'
  // import DatabaseEventName from '../../../../utils/DatabaseEventName'
  import api from '../../../../utils/api'
  import ConfirmAlert from '../Common/ConfirmAlert'
  import settings from 'electron-settings'
  import { faRedo, faSync } from '@fortawesome/free-solid-svg-icons'
  import ipcRendererSend from '../../services/ipc'
  import streamService from '../../services/stream'
  const { remote } = window.require('electron')

  export default {
    props: {
      localStreams: Array
    },
    data () {
      return {
        iconRedo: faRedo,
        iconRefresh: faSync,
        uploadingStreams: {},
        timeoutKeyboard: {},
        searchStr: '',
        mesure: '',
        showUserMenu: false,
        toggleSearch: false,
        showConfirmToLogOut: false,
        userName: this.getUserName(),
        userSites: [],
        isFetching: false,
        isRetryUploading: false,
        alertTitle: 'Are you sure you would like to continue?',
        alertContent: 'If you log out, you will lose all files and site info you have added to this app. They will not be deleted from RFCx Arbimon or Explorer.',
        streams: []
      }
    },
    components: {
      ConfirmAlert
    },
    computed: {
      selectedStreamId () {
        return this.$store.state.AppSetting.selectedStreamId
      },
      selectedStream () {
        return this.streams.find(s => s.id === this.selectedStreamId)
      },
      isRequiredSymbols () {
        return this.searchStr && this.searchStr.length > 0 && this.searchStr.length < 3
      }
    },
    methods: {
      toggleUserMenu () {
        this.showUserMenu = !this.showUserMenu
      },
      hide: function (e) {
        this.showUserMenu = false
      },
      getUserName () {
        let userName = remote.getGlobal('firstname')
        if (userName) return userName
        else return 'Awesome'
      },
      getUserPicture () {
        let userPicture = remote.getGlobal('picture')
        if (userPicture) return userPicture
        else return require(`../../assets/ic-profile-temp.svg`)
      },
      logOut () {
        this.$electron.ipcRenderer.send('logOut')
      },
      onFocusInput () {
        this.toggleSearch = !this.toggleSearch
        setTimeout(() => {
          if (this.toggleSearch) {
            this.$refs.searchStream.focus()
          }
        }, 0)
        if (!this.toggleSearch && this.searchStr === '') {
          return
        }
        if (!this.toggleSearch && this.searchStr !== '') {
          this.onRemoveSearchText()
        }
      },
      onRemoveSearchText () {
        this.searchStr = ''
        // TODO: show all streams
      },
      onKeyUp (event) {
        if ([13, 37, 38, 39, 40].includes(event.keyCode)) { return }
        if (event.keyCode === 8 && this.searchStr.length < 3) {
          // TODO: show all streams
          return
        }
        if (this.timeoutKeyboard) { clearTimeout(this.timeoutKeyboard) }
        this.timeoutKeyboard = setTimeout(() => {
          if (this.searchStr.length >= 3) {
            // TODO: find a stream
          }
        }, 500)
      },
      showDropDownMenu () {
        this.$emit('clickNewSiteButton')
      },
      hideDropDownMenu () {
        this.$emit('clickOutSideNewSiteButton')
      },
      getUploadingProcessIcon (enabled) {
        const state = enabled ? 'pause' : 'play'
        return require(`../../assets/ic-uploading-${state}-green.svg`)
      },
      getStateImgUrl (state) {
        if (state === '') return ''
        const iconName = fileState.getIconName(state)
        return require(`../../assets/${iconName}`)
      },
      async selectItem (stream) {
        await this.$store.dispatch('setSelectedStreamId', stream.id)
      },
      isActive (stream) {
        if (!stream || !this.selectedStream) return false
        return stream.id === this.selectedStream.id
      },
      getState (stream) {
        return streamHelper.getState(stream)
      },
      async repeatUploading (streamId) {
        if (this.isRetryUploading) return // prevent double click
        console.log('repeatUploading')
        // set session id
        const sessionId = this.$store.state.AppSetting.currentUploadingSessionId || '_' + Math.random().toString(36).substr(2, 9)
        await this.$store.dispatch('setCurrentUploadingSessionId', sessionId)

        // completion listener
        // let listen = (event, arg) => {
        //   this.$electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.reuploadFailedFilesResponse, listen)
        //   const t1 = performance.now()
        //   this.isRetryUploading = false
        //   console.log('[Measure] putFilesIntoUploadingQueue ' + (t1 - t0) + ' ms')
        // }

        // // emit to main process to put file in uploading queue
        // this.isRetryUploading = true
        // const data = {streamId: streamId, sessionId: sessionId}
        // this.$electron.ipcRenderer.send(DatabaseEventName.eventsName.reuploadFailedFilesRequest, data)
        // this.$electron.ipcRenderer.on(DatabaseEventName.eventsName.reuploadFailedFilesResponse, listen)
        this.isRetryUploading = true
        let files = await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { streamId: streamId, state: ['failed', 'server_error'] } })
        files = files.filter((f) => {
          return fileState.canRedo(f.state, f.stateMessage)
        })
        for (let file of files) {
          await ipcRendererSend('db.files.update', `db.files.update.${file.id}.${Date.now()}`, {
            id: file.id,
            params: { state: 'waiting', stateMessage: null, sessionId }
          })
        }

        // const stream = await ipcRendererSend('db.streams.get', `db.streams.get.${Date.now()}`, streamId)
        // const preparingCount = stream.preparingCount - files.length
        // const sessionTotalCount = stream.sessionTotalCount + files.length
        // await ipcRendererSend('db.streams.update', `db.streams.update.${Date.now()}`, { id: streamId, params: { preparingCount, sessionTotalCount } })
        this.isRetryUploading = false

        // set selected tab to be queue tab
        const tabObject = {}
        tabObject[this.selectedStreamId] = 'Queued'
        await this.$store.dispatch('setSelectedTab', tabObject)

        // always enable uploading process
        await this.$store.dispatch('enableUploadingProcess', true)
      },
      showPopupToLogOut () {
        this.showConfirmToLogOut = true
      },
      hidePopupToLogOut () {
        this.showConfirmToLogOut = false
      },
      isProductionEnv () {
        return settings.get('settings.production_env')
      },
      fetchUserSites () {
        let listener = (event, arg) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          console.log('getUserSites')
          api.getUserSites(this.isProductionEnv(), arg)
            .then(async sites => {
              this.isFetching = false
              if (sites && sites.length) {
                let userSites = streamHelper.parseUserSites(sites)
                await streamService.upsertStreams(userSites)
                // insert site success set selected site
                await this.reloadStreamListFromLocalDB()
                if (!this.selectedStreamId) {
                  await this.$store.dispatch('setSelectedStreamId', userSites.sort((siteA, siteB) => siteB.updatedAt - siteA.updatedAt)[0].id)
                }
              }
            }).catch(error => {
              this.isFetching = false
              console.log(`error while getting user's sites`, error)
            })
        }
        this.isFetching = true
        this.$electron.ipcRenderer.send('getIdToken')
        this.$electron.ipcRenderer.on('sendIdToken', listener)
      },
      async reloadStreamListFromLocalDB () {
        this.streams = await ipcRendererSend('db.streams.getStreamWithStats', `db.streams.getStreamWithStats.${Date.now()}`, { order: [['updated_at', 'DESC']] })
        this.$emit('reFetchStreams', this.streams)
      }
    },
    watch: {
      localStreams (newValue, oldValue) {
        if (newValue === oldValue) return
        if (newValue === this.streams) return
        this.streams = this.localStreams
      }
    },
    async created () {
      this.fetchUserSites()
      if (remote.getGlobal('firstLogIn')) {
        this.$electron.ipcRenderer.send('resetFirstLogIn')
      }
    }
  }
</script>

<style lang="scss" scoped>
  .wrapper {
    &__stream-row:hover,
    &__stream-row_active {
      background-color: #2e3145;
      cursor: pointer;
    }
    &__stream-row {
      padding: 9px $default-padding 8px;
      height: 42px;
      &_active {
        font-weight: $title-font-weight;
      }
      .menu-container {
        height: 25px;
        align-items: center;
      }
    }
    &__header {
      padding: 0 12px 0 $default-padding;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 37px;
    }
    &__user-pic {
      cursor: pointer;
      margin-left: auto;
    }
    &__logo {
      margin-right: 10px;
      height: 37px;
      cursor: pointer;
      img {
        height: 37px;
        width: auto;
      }
    }
    &__stat {
      padding: 0 8px 0  16px;
      margin-bottom: 16px;
      line-height: 1.29;
      letter-spacing: 0.2px;
      animation-duration: 4s;
      animation-delay: 2s;
    }
    &__user-name {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    &__controls {
      padding: 0 8px;
      a {
        width: $full-width;
      }
    }
    &__title {
      padding: 24px $default-padding 10px;
      font-size: 16px;
      font-style: normal;
      line-height: normal;
      color: $white-color !important;
      margin: 0 !important;
      align-self: center;
      font-weight: $title-font-weight;
      text-transform: none;
      letter-spacing: 0.2px;
      display: flex;
      justify-content: space-between;
    }
    &__search {
      border-radius: 3px;
      border: solid 1px $white-color;
      display: inline-block;
      vertical-align: middle;
      width: 98%;
      padding: 0 5px;
      margin-bottom: 7px;
      height: 29px;
      line-height: normal;
      &_red {
        border: solid 1px red;
      }
    }
    &__input {
      display: inline-block;
      vertical-align: top;
      width: 87%;
      height: 27px;
      padding: 0 0 1px 0px;
      font-family: $family-sans-serif;
      font-size: 13px;
      background-color: $side-menu-background;
      color: $white-color;
      border: none;
      box-shadow: none;
    }
    &__stream-name {
      text-overflow: ellipsis;
      overflow: hidden;
      margin-right: 3px;
      align-self: center;
    }
    &__loader {
      display: inline-block;
      margin: 0 4px;
    }
  }
  .rounded-button {
    span {
      margin-right: 10px;
      font-size: 20px;
    }
  }
  .icon-logo {
    &:hover,
    &:focus {
      text-decoration: none;
      border: none;
      outline: none;
    }
  }
  .user-pic {
    border-radius: 50%;
    height: $full-height;
    height: 32px;
    width: auto;
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
    margin: 5px 0;
  }
  .btn-remove {
    background-color: transparent;
    border: none !important;
    color: $white-color;
    text-align: right;
    opacity: 0.2;
    padding: 0;
    width: 10%;
    line-height: 1.6;
    margin-top: 7px;
    cursor: pointer;
    img {
      width: 12px;
      height: 12px;
    }
  }
  .btn-remove-active {
    opacity: 1;
  }
  .drop-hover {
    background-color: transparent !important;
  }
  .iconRedo {
    color: grey;
    font-size: 13px;
    cursor: pointer;
    margin: 6px 6px 6px 0;
  }
  .iconRefresh {
    color: grey;
    font-size: 13px;
    cursor: pointer;
  }
  .iconRefresh:hover {
    color: white;
  }
  input[type="text"]::-webkit-input-placeholder {
    color: $input-placeholder !important;
    opacity: 1;
  }
  .button {
    &:focus {
      color: $button-hover-color;
      border-color: $button-hover-border-color;
    }
  }
  :-ms-input-placeholder {
    color: $input-placeholder;
  }
  ::-moz-placeholder {
    color: $input-placeholder;
  }
  :-moz-placeholder {
    color: $input-placeholder;
  }
</style>
