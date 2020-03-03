<template>
  <aside class="column menu side-menu side-menu-column" :class="{ 'drag-active': isDragging && streams && streams.length > 0}" @dragenter="handleDrag" @dragover="handleDrag" @drop.prevent="handleDrop" @dragover.prevent @dragleave="outDrag">
    <div class="menu-container side-menu-title">
      <p class="menu-label"> {{ menuTitle }} </p>
      <div class="side-menu-controls-wrapper">
        <a :title="isUploadingProcessEnabled? 'Pause uploading process' : 'Continue uploading process'" v-if="selectedStream && !hidePause(streams)" href="#" @click="toggleUploadingProcess()" style="padding-right: 0.25rem"><img class="side-menu-controls-btn" :src="getUploadingProcessIcon(this.isUploadingProcessEnabled)"></a>
        <router-link title="Create a new stream" to="/add"><img class="side-menu-controls-btn" src="~@/assets/ic-add-btn.svg"></router-link>
      </div>
    </div>
    <ul class="menu-list">
      <li v-for="stream in streams" :key="stream.id">
        <div class="menu-item" v-on:click="selectItem(stream)" :class="{ 'is-active': isActive(stream) , 'drop-hover': isDragging}">
          <div class="menu-container" :class="{ 'menu-container-failed': getState(stream) === 'failed'  || getState(stream) === 'duplicated'}">
            <span class="stream-title"> {{ stream.name }} (_{{ stream.id.substring(0, 4) }}) </span>
            <font-awesome-icon class="iconRedo" v-if="getState(stream) === 'failed' || checkWarningLoad(stream)" :icon="iconRedo" @click="repeatUploading(stream.id)"></font-awesome-icon>
            <img :src="getStateImgUrl(getState(stream))">
          </div>
          <div class="state-progress" v-if="shouldShowProgress(stream)">
            <progress class="progress is-primary" :class="{ 'is-warning': checkWarningLoad(stream), 'is-success': isFilesHidden(stream), 'is-danger': getState(stream) === 'duplicated' || getState(stream) === 'failed' }" :value="getProgress(stream)" max="100"></progress>
            <div class="menu-container" :class="{ 'right': checkWarningLoad(stream) || isFilesHidden(stream) || getState(stream) === 'failed' || getState(stream) === 'duplicated' }">
              <span class="is-size-7 menu-container-left">{{ checkWarningLoad(stream) || isFilesHidden(stream) || getState(stream) === 'failed' || getState(stream) === 'duplicated' ? '' : getState(stream) }}</span>
              <span class="is-size-7 menu-container-right"> {{ getStateStatus(stream) }} </span>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </aside>
</template>

<script>
  import { mapState } from 'vuex'
  import Stream from '../../store/models/Stream'
  import File from '../../store/models/File'
  import fileHelper from '../../../../utils/fileHelper'
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
  import { faRedo } from '@fortawesome/free-solid-svg-icons'

  export default {
    data () {
      return {
        iconRedo: faRedo,
        menuTitle: 'Streams',
        uploadingStreams: {},
        isDragging: false
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
      files () {
        return File.query().where('streamId', this.selectedStreamId).orderBy('name').get()
      },
      isDuplicated () {
        let count = 0
        this.files.forEach(file => {
          if (file.state === 'complited' || file.state === 'duplicated') {
            count++
          }
        })
        if (count === this.files.length) return true
        else return false
      }
    },
    methods: {
      outDrag (e) {
        // FIX dropleave event
        // e.preventDefault()
        // this.isDragging = false
      },
      handleDrag (e) {
        this.isDragging = true
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
      getUploadingProcessIcon (enabled) {
        const state = enabled ? 'pause' : 'play'
        return require(`../../assets/ic-uploading-${state}-green.svg`)
      },
      getStateImgUrl (state) {
        return require(`../../assets/ic-state-${state}.svg`)
      },
      selectItem (stream) {
        this.$store.dispatch('setSelectedStreamId', stream.id)
      },
      isActive (stream) {
        if (this.selectedStream === null) return false
        return stream.id === this.selectedStream.id
      },
      shouldShowProgress (stream) {
        return true
        // this.getState(stream) !== 'completed' && this.getState(stream) !== 'failed' && this.getState(stream) !== 'duplicated'
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
          if (this.getState(stream) === 'completed' || this.getState(stream) === 'failed' || this.getState(stream) === 'duplicated') {
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
        } else if (state === 'waiting') return stream.files.length + (stream.files.length > 1 ? ' files' : ' file')
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

<style >

  .drag-active {
    border: 4px solid #cac5c5 !important;
    background-color: #cac5c5 !important;
    opacity: 0.3 !important;
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

  .menu-container-left {
    width: 25%;
    text-align: left;
  }

  .menu-container-right {
    width: 74%;
    text-align: right;
  }

</style>
