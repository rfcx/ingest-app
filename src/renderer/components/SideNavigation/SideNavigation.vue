<template>
  <aside class="column menu side-menu side-menu-column">
    <div class="header">
      <div class="header-logo">
        <router-link to="/"><img src="~@/assets/rfcx-logo.png" alt="rfcx" class="icon-logo"></router-link>
      </div>
      <div class="header-env">
        <button class="button" :class="{ 'is-primary': productionEnv, 'is-dark': !productionEnv }" @click="switchEnvironment()">
          {{ productionEnv ? 'production' : 'staging' }}
        </button>
      </div>
      <div class="dropdown header-user-pic is-right" :class="{ 'is-active': showDropDown }" @click="toggleDropDown()" title="User menu: you can log out here">
        <div class="dropdown-trigger">
          <img title="Menu" class="user-pic" :src="getUserPicture()" alt="" @error="$event.target.src=require(`../../assets/ic-profile-temp.svg`)" aria-haspopup="true" aria-controls="dropdown-menu">
        </div>
        <div class="dropdown-menu" id="dropdown-menu" role="menu">
          <div class="dropdown-content">
            <a href="#" title="Logout" class="dropdown-item" @click="logOut()">Log out</a>
          </div>
        </div>
      </div>
      <!-- <div class="header-user-pic" @click="toggleUserMenu()">
        <img title="Menu" class="user-pic" :src="getUserPicture()" alt="" @error="$event.target.src=require(`../../assets/ic-profile-temp.svg`)">
      </div> -->
    </div>
    <!-- <div class="user-stat-wrapper" v-if="showUserMenu">
      <div class="user-stat-name">{{ userName }}</div>
      <button class="button user-stat-btn" @click="logOut()">Log out</button>
      <div class="user-stat-info-wrapper">
        <div class="user-stat-info">
          <div>{{streams.length}}</div><div>streams created</div>
        </div>
        <div class="user-stat-info">
          <div>0</div><div>hours long</div>
        </div>
        <div class="user-stat-info">
          <div>{{allFiles.length}}</div><div>files uploaded</div>
        </div>
        <div class="user-stat-info">
          <div>{{getAllFilesSize()}}</div><div>{{mesure}} used</div>
        </div>
      </div>
    </div> -->
    <div class="menu-container side-menu-title">
      <div class="menu-label">Streams</div>
      <div class="side-menu-controls-wrapper">
        <!-- <button title="Filter" class="side-menu-search-btn" v-on:click="onFocusInput()">
          <img v-if="!toggleSearch" src="~@/assets/ic-search.svg">
          <img v-if="toggleSearch" src="~@/assets/ic-search-active.svg">
        </button> -->
        <router-link title="Add new stream" to="/add"><img class="side-menu-add-btn" src="~@/assets/ic-add-stream.svg"></router-link>
      </div>
    </div>
    <div v-if="toggleSearch" class="search-wrapper" :class="{ 'search-wrapper_red': isRequiredSymbols }">
      <input type="text" class="input search-input" placeholder="Filter" v-model="searchStr"
        @keyup="onKeyUp($event)" ref="searchStream">
      <button title="Remove search text" class="btn-remove" @click="onRemoveSearchText()"
        :class="{ 'btn-remove-active': searchStr }">
        <img src="~@/assets/ic-remove.svg">
      </button>
    </div>
    <ul class="menu-list">
      <li v-for="stream in streams" :key="stream.id">
        <div class="menu-item" v-on:click="selectItem(stream)" :class="{'menu-item_active': isActive(stream)}">
          <div class="menu-container" :class="{ 'menu-container-failed': stream.isError }">
            <div class="stream-title">{{ stream.name }}</div>
            <font-awesome-icon class="iconRedo" v-if="stream.canRedo || checkWarningLoad(stream)" :icon="iconRedo" @click="repeatUploading(stream.id)"></font-awesome-icon>
            <img :src="getStateImgUrl(stream.state)">
          </div>
        </div>
      </li>
    </ul>
  </aside>
</template>

<script>
  import { mapState } from 'vuex'
  import settings from 'electron-settings'
  import Stream from '../../store/models/Stream'
  import File from '../../store/models/File'
  import fileState from '../../../../utils/fileState'
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
  import { faRedo } from '@fortawesome/free-solid-svg-icons'
  const { remote } = window.require('electron')

  export default {
    data () {
      return {
        iconRedo: faRedo,
        uploadingStreams: {},
        timeoutKeyboard: {},
        searchStr: '',
        mesure: '',
        showUserMenu: false,
        toggleSearch: false,
        showDropDown: false,
        userName: this.getUserName(),
        productionEnv: this.isProductionEnv()
      }
    },
    components: {
      FontAwesomeIcon
    },
    computed: {
      ...mapState({
        isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess
      }),
      selectedStreamId () {
        return this.$store.state.Stream.selectedStreamId
      },
      selectedStream () {
        return Stream.find(this.selectedStreamId)
      },
      streams () {
        return Stream.query().with('files').get().sort((streamA, streamB) => {
          return fileState.getStatePriority(streamA) - fileState.getStatePriority(streamB)
        })
      },
      allFiles () {
        return File.all()
      },
      files () {
        return File.query().where('streamId', this.selectedStreamId).orderBy('name').get()
      },
      getUnsyncedFiles () {
        return File.query().where('state', 'waiting').orderBy('timestamp').get()
      },
      getUploadedFiles () {
        return File.query().where((file) => {
          return file.state === 'ingesting' && file.uploadId !== ''
        }).orderBy('timestamp').get()
      },
      isInprogessOfUploading () {
        return this.getUnsyncedFiles.length > 0 || this.getUploadedFiles.length > 0
      },
      isRequiredSymbols () {
        return this.searchStr && this.searchStr.length > 0 && this.searchStr.length < 3
      }
    },
    methods: {
      getAllFilesSize () {
        let size = 0
        this.allFiles.forEach(file => { size += file.sizeInByte })
        return this.getFileSize(size)
      },
      getFileSize (bytes) {
        var sizes = ['bytes', 'kb', 'mb', 'gb', 'tb']
        if (bytes === 0) {
          this.mesure = sizes[0]
          return '0'
        }
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
        this.mesure = sizes[i]
        return Math.round(bytes / Math.pow(1024, i), 2)
      },
      switchEnvironment () {
        if (this.isInprogessOfUploading) {
          return
        }
        settings.set('settings.production_env', !this.isProductionEnv())
        this.productionEnv = this.isProductionEnv()
      },
      isProductionEnv () {
        return settings.get('settings.production_env')
      },
      toggleUserMenu () {
        this.showUserMenu = !this.showUserMenu
      },
      toggleDropDown () {
        this.showDropDown = !this.showDropDown
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
        let countComplited = 0
        let countDisabled = 0
        stream.files.forEach((file) => {
          if (file.disabled === true) {
            countDisabled++
          } else if (file.state === 'failed' || file.state === 'duplicated') {
            countFailed++
          } else if (file.state === 'completed') {
            countComplited++
          }
        })
        if (countFailed !== stream.files.length && countComplited !== stream.files.length && (countFailed + countComplited + countDisabled) === stream.files.length &&
          (countDisabled + countComplited) !== stream.files.length && (countDisabled + countFailed + countComplited) === stream.files.length) return true
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
      getFailedFiles (streamId) {
        return new Promise((resolve, reject) => {
          const files = File.query().where((file) => {
            return file.state === 'failed' && file.streamId === streamId
          }).get()
          if (files != null) {
            resolve(files)
          } else {
            reject(new Error('No failed files'))
          }
        })
      },
      repeatUploading (streamId) {
        let listener = (event, arg) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          let idToken = null
          idToken = arg
          return this.getFailedFiles(streamId).then((files) => {
            console.log('files', files)
            for (let i = 0; i < files.length; i++) {
              this.$file.uploadFile(files[i], idToken)
            }
          })
        }
        this.$electron.ipcRenderer.send('getIdToken')
        this.$electron.ipcRenderer.on('sendIdToken', listener)
      }
    }
  }
</script>

<style lang="scss" scoped>

  .menu-item:hover,
  .menu-item_active {
    background-color: #2e3145;
    cursor: pointer;
  }

  .menu-item_active {
    font-weight: $title-font-weight;
  }

  .header {
    padding: 0 8px 0 16px;
    margin-bottom: 7px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 37px;
  }

  .header-logo,
  .header-env,
  .header-user-pic {
    cursor: pointer;
  }

  .header-logo {
    margin-right: 10px;
    height: 37px;
    img {
      height: 37px;
      width: auto;
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

  .header-env {
    button {
      height: 1.8em;
      font-size: 12px;
      padding-top: calc(0.1em - 0px);
      padding-bottom: calc(0.175em - 0px);
    }
  }

  .header-user-pic {
    margin-left: auto;
  }

  .user-stat-wrapper {
    padding: 0 8px 0 16px;
    margin-bottom: 7px;
    font-family: Lato;
    font-size: 14px;
    font-weight: normal;
    font-stretch: normal;
    font-style: normal;
    line-height: 1.29;
    letter-spacing: 0.2px;
    animation-duration: 4s;
    animation-delay: 2s;
  }

  .user-stat-name {
    margin-bottom: 5px;
  }

  .user-stat-btn {
    font-family: Lato !important;
    font-weight: normal !important;
    font-stretch: normal !important;
    font-style: normal !important;
    line-height: 1.29 !important;
    letter-spacing: 0.2px !important;
    margin-bottom: 10px;
    height: 19px !important;
    font-size: 12px !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  .user-stat-info-wrapper {
    margin: 0;
    padding: 0;
  }

  .user-stat-info {
    display: flex;
    justify-content: flex-start;
    div {
      width: 35%;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 5px;
      &:last-child {
         width: 65%;
      }
    }
  }

  .user-pic {
    border-radius: 50%;
    height: 100%;
    height: 32px;
    width: auto;
  }

  .dropdown-menu {
    min-width: 20px;
  }

  .side-menu-title {
    padding: 2px 8px 2px 16px;
  }

  .side-menu-search-btn {
    background-color: transparent;
    border: none !important;
    padding: 0 !important;
    margin-right: 5px;
    cursor: pointer;
    &:hover,
    &:active,
    &:focus {
      outline: none !important;
      border: none !important;
    }
    img {
      height: 15px;
      width: 15px;
    }
  }

  .side-menu-add-btn {
    img {
      height: 20px;
      width: 20px;
    }
  }

  .menu-item {
    padding: 9px 16px 8px 16px;
    height: 42px;
  }

  .menu-label {
    font-size: $default-font-size;
    font-style: normal;
    line-height: normal;
    color: #ffffff !important;
    margin: 0 !important;
    align-self: center;
    font-weight: $title-font-weight;
    text-transform: none;
    letter-spacing: 0.2px;
  }

  .search-wrapper {
    border-radius: 3px;
    border: solid 1px #ffffff;
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

  .search-input {
    display: inline-block !important;
    vertical-align: top !important;
    width: 87% !important;
    height: 27px !important;
    padding: 0 0 1px 0px !important;
    font-family: Lato;
    font-size: 13px !important;
    font-weight: normal;
    font-stretch: normal;
    font-style: normal;
    line-height: normal !important;
    letter-spacing: 0.67px;
    background-color: #232436 !important;
    color: #ffffff !important;
    border: none !important;
    box-shadow: none !important;
  }

  .btn-remove {
    background-color: transparent;
    border: none !important;
    color: #ffffff;
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

  .right {
    text-align: right !important;
    justify-content: flex-end !important;
  }

  .iconRedo {
    color: grey;
    font-size: 13px;
    cursor: pointer;
    margin-left: 3px !important;
  }

  .is-danger {
    background-color: #f14668 !important;
    border-color: transparent;
  }

  .menu-container-left,
  .menu-container-right {
    font-size: 11px;
    font-weight: 500;
    font-stretch: normal;
    font-style: normal;
    line-height: normal;
    letter-spacing: normal;
    text-align: right;
    color: #f1f1f1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .menu-container-left {
    width: 35%;
    text-align: left;
  }

  .menu-container-right {
    width: 64%;
    text-align: right;
  }

  input[type="text"]::-webkit-input-placeholder {
    color: #52566e !important;
    opacity: 1;
  }
  :-ms-input-placeholder {
    color: #52566e;
  }
  ::-moz-placeholder {
    color: #52566e;
  }
  :-moz-placeholder {
    color: #52566e;
  }

</style>
