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
      <div class="header-user-pic" @click="toggleUserMenu()">
        <img title="Menu" class="user-pic" :src="getUserPicture()" alt="" @error="$event.target.src=require(`../../assets/ic-profile-temp.svg`)">
      </div>
    </div>
    <div class="user-stat-wrapper" v-if="showUserMenu">
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
    </div>
    <div class="menu-container side-menu-title">
      <div class="menu-label">Streams</div>
      <div class="side-menu-controls-wrapper">
        <button title="Filter" class="side-menu-search-btn" v-on:click="onFocusInput()">
          <img v-if="!toggleSearch" src="~@/assets/ic-search.svg">
          <img v-if="toggleSearch" src="~@/assets/ic-search-active.svg">
        </button>
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
            <img v-if="stream.isUploading || stream.isError" :src="getStateImgUrl(stream.state)">
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
  import FileState from '../../../../utils/fileState'
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
          return this.getStatePriority(streamA) - this.getStatePriority(streamB)
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
      isDuplicated () {
        let count = 0
        this.files.forEach(file => {
          if (FileState.isDuplicated(file.state)) {
            count++
          }
        })
        if (count === this.files.length) return true
        else return false
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
        if (FileState.isPreparing(state)) return ''
        const s = FileState.isError(state) ? 'failed' : state
        return require(`../../assets/ic-state-${s}.svg`)
      },
      selectItem (stream) {
        this.$store.dispatch('setSelectedStreamId', stream.id)
      },
      isActive (stream) {
        if (this.selectedStream === null) return false
        return stream.id === this.selectedStream.id
      },
      shouldShowProgress (stream) {
        return this.getState(stream) !== 'completed' && this.getState(stream) !== 'failed' && this.getState(stream) !== 'duplicated'
      },
      sendNotification (status) {
        let notificationCompleted = {
          title: 'Ingest App',
          body: 'Stream uploaded successfully'
        }
        if (status === 'completed') {
          let myNotificationCompleted = new window.Notification(notificationCompleted.title, notificationCompleted)
          myNotificationCompleted.onshow = () => {
            console.log('show notification')
          }
        }
      },
      getState (stream) {
        if (stream.files && !stream.files.length) {
          return 'waiting'
        }
        if (stream.completed === true) {
          return 'completed'
        }
        const hasFiles = stream.files && stream.files.length
        const total = stream.files.length
        const completedFiles = stream.files.filter(file => file.state === 'completed').length
        const waitingFiles = stream.files.filter(file => file.state === 'waiting').length
        const failedFiles = stream.files.filter(file => file.state === 'failed').length
        const duplicatedFiles = stream.files.filter(file => file.state === 'duplicated').length
        const ingestingFiles = stream.files.filter(file => file.state === 'ingesting').length
        const isCompleted = hasFiles && total === completedFiles
        const isWaiting = hasFiles && total === waitingFiles
        const isFailed = hasFiles && failedFiles > 0 && total === (failedFiles + duplicatedFiles)
        const isDuplicated = hasFiles && total === duplicatedFiles
        const isIngesting = hasFiles && total === ingestingFiles
        if (isCompleted) {
          if (!!this.uploadingStreams[stream.id] && this.uploadingStreams[stream.id] !== 'completed') {
            const notifiedStream = stream.files && stream.files.length && stream.files.every(file => file.notified === true)
            if (!notifiedStream) {
              this.sendNotification('completed')
            }
          }
          this.uploadingStreams[stream.id] = 'completed'
          stream.completed = true
          return 'completed'
        } else if (isWaiting) {
          this.uploadingStreams[stream.id] = 'waiting'
          stream.completed = false
          return 'waiting'
        } else if (isFailed) {
          this.uploadingStreams[stream.id] = 'failed'
          stream.completed = false
          return 'failed'
        } else if (isDuplicated) {
          this.uploadingStreams[stream.id] = 'duplicated'
          stream.completed = false
          return 'duplicated'
        } else if (isIngesting) {
          this.uploadingStreams[stream.id] = 'ingesting'
          stream.completed = false
          return 'ingesting'
        } else {
          this.uploadingStreams[stream.id] = 'uploading'
          stream.completed = false
          return 'uploading'
        }
      },
      hidePause (streams) {
        let count = 0
        streams.forEach(stream => {
          if (stream.isCompleted || stream.isError) {
            count++
          } else if (this.getState(stream) === 'uploading' && this.checkWarningLoad(stream)) {
            count++
          }
        })
        if (count === streams.length) return true
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
      getStatePriority (stream) {
        const state = this.getState(stream)
        switch (state) {
          case 'waiting': return 0
          case 'uploading': return 1
          case 'ingesting': return 2
          case 'failed': return 3
          case 'duplicated': return 4
          case 'completed': return 5
        }
      },
      getProgress (stream) {
        const state = this.getState(stream)
        if (state === 'completed') return 100
        else if (state === 'waiting' || state === 'failed' || state === 'duplicated') return 0
        else if (this.checkWarningLoad(stream)) return 100
        else if (this.isFilesHidden(stream)) return 100
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        const uploadedFiles = stream.files.filter(file => { return file.state === 'ingesting' || file.state === 'completed' })
        const completedPercentage = completedFiles.length / (stream.files.length * 2) * 100
        const uploadedPercentage = uploadedFiles.length / (stream.files.length * 2) * 100
        return completedPercentage + uploadedPercentage
      },
      getStateStatus (stream) {
        const state = this.getState(stream)
        if (state === 'duplicated') {
          const duplicatedFiles = stream.files.filter(file => { return file.state === 'duplicated' })
          return `0/${duplicatedFiles.length} ingested | ${duplicatedFiles.length} ${duplicatedFiles.length > 1 ? 'errors' : 'error'}`
        } else if (state === 'failed') {
          const failedFiles = stream.files.filter(file => { return file.state === 'failed' })
          return `0/${failedFiles.length} ingested | ${failedFiles.length} ${failedFiles.length > 1 ? 'errors' : 'error'}`
        } else if (state === 'completed') {
          const successedFiles = stream.files.filter(file => { return file.state === 'completed' })
          return `${successedFiles.length}/${successedFiles.length} ingested | 0 errors`
        } else if (state === 'waiting') return stream.files.length + (stream.files.length > 1 ? '+ files' : ' file')
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        const errorFiles = stream.files.filter(file => { return file.state === 'failed' || file.state === 'duplicated' })
        if (errorFiles.length < 1) return `${completedFiles.length}/${stream.files.length} ingested`
        if (this.isFilesHidden(stream)) {
          let count = 0
          stream.files.forEach(file => {
            if (file.state === 'completed') {
              count++
            }
          })
          return `${completedFiles.length}/${count} ingested`
        }
        return `${completedFiles.length}/${stream.files.length} ingested | ${errorFiles.length} ${errorFiles.length > 1 ? 'errors' : 'error'}`
      },
      toggleUploadingProcess () {
        this.$store.dispatch('setUploadingProcess', !this.isUploadingProcessEnabled)
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

<style lang="scss">

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
    padding: 9px 16px 8px 16px !important;
  }

  .menu-label {
    font-family: Avenir !important;
    font-size: 10px !important;
    font-weight: 900 !important;
    font-stretch: normal;
    font-style: normal;
    line-height: normal;
    letter-spacing: normal !important;
    color: #ffffff !important;
    margin: 0 !important;
    align-self: center;
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
    font-family: Avenir;
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
