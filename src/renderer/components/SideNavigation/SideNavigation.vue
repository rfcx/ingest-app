<template>
  <aside class="column menu side-menu side-menu-column wrapper">
    <div class="wrapper__header">
      <div class="wrapper__logo">
        <router-link to="/"><img src="~@/assets/rfcx-logo.png" alt="rfcx" class="icon-logo"></router-link>
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
        <span>+</span>New Site
      </button>
    </div>
    <div class="wrapper__title">
      <span>Sites</span>
      <div class="loader" v-if="isFetching"></div>
      <button class="button is-small is-rounded" @click.prevent="getUserSites()" v-else><fa-icon class="iconRefresh" :icon="iconRefresh"></fa-icon></button>
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
          <div class="menu-container" :class="{ 'menu-container-failed': stream.isError }">
            <div class="wrapper__stream-name">{{ stream.name }}</div>
            <fa-icon class="iconRedo" v-if="stream.canRedo || checkWarningLoad(stream)" :icon="iconRedo" @click="repeatUploading(stream.id)"></fa-icon>
            <img :src="getStateImgUrl(stream.state)">
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
  import Stream from '../../store/models/Stream'
  import File from '../../store/models/File'
  import fileState from '../../../../utils/fileState'
  import streamHelper from '../../../../utils/streamHelper'
  import api from '../../../../utils/api'
  import DatabaseEventName from '../../../../utils/DatabaseEventName'
  import ConfirmAlert from '../Common/ConfirmAlert'
  import settings from 'electron-settings'
  import { faRedo, faSync } from '@fortawesome/free-solid-svg-icons'
  const { remote } = window.require('electron')

  export default {
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
        alertTitle: 'Are you sure you would like to continue?',
        alertContent: 'If you log out, you will lose all files and site info you have added to this app. They will not be deleted from RFCx Arbimon or Explorer.'
      }
    },
    components: {
      ConfirmAlert
    },
    computed: {
      selectedStreamId () {
        return this.$store.state.Stream.selectedStreamId
      },
      selectedStream () {
        return Stream.find(this.selectedStreamId)
      },
      streams () {
        return Stream.query().with('files').orderBy('updatedAt', 'desc').get()
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
      selectItem (stream) {
        this.$store.dispatch('setSelectedStreamId', stream.id)
      },
      isActive (stream) {
        if (this.selectedStream === null) return false
        return stream.id === this.selectedStream.id
      },
      checkWarningLoad (stream) {
        let countFailed = 0
        let countCompleted = 0
        let countDisabled = 0
        stream.files.forEach((file) => {
          if (file.disabled === true) {
            countDisabled++
          } else if (file.state === 'failed' || file.state === 'duplicated') {
            countFailed++
          } else if (file.state === 'completed') {
            countCompleted++
          }
        })
        if (countFailed !== stream.files.length && countCompleted !== stream.files.length && (countFailed + countCompleted + countDisabled) === stream.files.length &&
          (countDisabled + countCompleted) !== stream.files.length && (countDisabled + countFailed + countCompleted) === stream.files.length) return true
        else return false
      },
      isFilesHidden (stream) {
        let count = 0
        stream.files.forEach(file => {
          if (file.disabled === true || file.state === 'completed') {
            count++
          }
        })
        if (count === stream.files.length) return true
        else return false
      },
      repeatUploading (streamId) {
        console.log('repeatUploading')
        const files = File.query().where((file) => {
          return file.canRedo && file.streamId === streamId
        }).get()
        this.$file.putFilesIntoUploadingQueue(files)
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
      getUserSites () {
        let listener = (event, arg) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          console.log('getUserSites')
          api.getUserSites(this.isProductionEnv(), arg)
            .then(sites => {
              this.isFetching = false
              if (sites && sites.length) {
                let userSites = streamHelper.parseUserSites(sites)
                let insertSiteListener = (event, arg) => {
                  this.$electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.insertSitesResponse, insertSiteListener)
                  // insert site success set selected site
                  if (!this.selectedStreamId) {
                    this.$store.dispatch('setSelectedStreamId', userSites.sort((siteA, siteB) => siteB.updatedAt - siteA.updatedAt)[0].id)
                  }
                }
                this.$electron.ipcRenderer.send(DatabaseEventName.eventsName.insertSitesRequest, userSites)
                this.$electron.ipcRenderer.on(DatabaseEventName.eventsName.insertSitesResponse, insertSiteListener)
              }
            }).catch(error => {
              this.isFetching = false
              console.log(`error while getting user's sites`, error)
            })
        }
        this.isFetching = true
        this.$electron.ipcRenderer.send('getIdToken')
        this.$electron.ipcRenderer.on('sendIdToken', listener)
      }
    },
    created () {
      if (remote.getGlobal('firstLogIn')) {
        this.getUserSites()
        this.$electron.ipcRenderer.send('resetFirstLogIn')
      } else {
        let getUserSitesListener = (event) => {
          this.$electron.ipcRenderer.removeListener('onMainWindowIsActive', getUserSitesListener)
          console.log('onMainWindowIsActive')
          this.getUserSites()
        }
        this.$electron.ipcRenderer.on('onMainWindowIsActive', getUserSitesListener)
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
    color: white;
    font-size: 9px;
    cursor: pointer;
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
