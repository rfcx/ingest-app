<template>
  <div id="wrapper-api-service">API Service</div>
</template>

<script>
  import { mapState } from 'vuex'
  import File from '../store/models/File'
  
  const workerTimeoutMaximum = 10000
  const workerTimeoutMinimum = 3000

  export default {
    data: () => {
      return {
        checkStatusWorkerTimeout: workerTimeoutMinimum,
        checkWaitingFilesInterval: null
      }
    },
    computed: {
      ...mapState({
        isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess,
        currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId
      }),
      filesInUploadingSession () {
        if (!this.currentUploadingSessionId) return []
        return File.query().where('sessionId', this.currentUploadingSessionId).get()
      }
    },
    watch: {
      isUploadingProcessEnabled (val, oldVal) {
        console.log('isUploadingProcessEnabled', val, oldVal)
        if (val === oldVal) return
        this.checkStatusWorkerTimeout = workerTimeoutMinimum
        this.tickCheckStatus()
      },
      filesInUploadingSession (val, oldVal) {
        if (val === oldVal) return
        // all files in the session has completed
        this.checkFilesInUploadingSessionId(val)
      }
    },
    methods: {
      getUploadingFiles () {
        return new Promise((resolve, reject) => {
          let files = File.query().where('state', 'uploading').orderBy('timestamp').get()
          resolve(files != null ? files : [])
        })
      },
      getSuspendedFiles () {
        return new Promise((resolve, reject) => {
          let files = File.query().where(file => { return file.state === 'uploading' && file.uploadId !== '' && file.uploaded === false }).orderBy('timestamp').get()
          resolve(files != null ? files : [])
        })
      },
      getUnsyncedFile () {
        return new Promise((resolve, reject) => {
          const file = File.query().where('state', 'waiting')
            .orderBy('retries', 'desc')
            .orderBy('timestamp', 'asc')
            .first()
          console.log('\nwaiting file ', file)
          if (file != null) {
            resolve(file)
          } else {
            reject(new Error('No waiting files'))
          }
        })
      },
      getUploadedFile () {
        return new Promise((resolve, reject) => {
          const file = File.query().where((file) => {
            return (file.state === 'ingesting' || file.state === 'uploading') && file.uploadId !== '' && file.uploaded === true
          }).orderBy('timestamp').first()
          if (file != null) {
            resolve(file)
          } else {
            reject(new Error('No uploaded files'))
          }
        })
      },
      uploadFile (file) {
        let listener = (event, arg) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          let idToken = null
          idToken = arg
          return this.$file.uploadFile(file, idToken)
        }
        this.$electron.ipcRenderer.send('getIdToken')
        this.$electron.ipcRenderer.on('sendIdToken', listener)
      },
      queueFileToUpload () {
        return this.getUnsyncedFile().then((file) => {
          return this.uploadFile(file)
        }).catch((err) => {
          console.log(err)
        })
      },
      queueJobToCheckStatus () {
        return this.getUploadedFile().then((file) => {
          let listener = (event, arg) => {
            this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
            let idToken = arg
            return this.$file.checkStatus(file, idToken, false)
          }
          this.$electron.ipcRenderer.send('getIdToken')
          this.$electron.ipcRenderer.on('sendIdToken', listener)
        })
      },
      tickUpload () {
        if (!this.isUploadingProcessEnabled) return
        return this.getUploadingFiles()
          .then((files) => {
            if (!files.length) {
              console.log('\nNo uploading files', files)
              this.queueFileToUpload()
            }
          })
      },
      tickCheckStatus () {
        if (!this.isUploadingProcessEnabled) return
        this.queueJobToCheckStatus().then(() => {
          this.checkStatusWorkerTimeout = workerTimeoutMinimum
          setTimeout(() => { this.tickCheckStatus() }, this.checkStatusWorkerTimeout)
        }).catch((err) => {
          console.log(err)
          this.checkStatusWorkerTimeout = Math.min(2 * this.checkStatusWorkerTimeout, workerTimeoutMaximum)
          setTimeout(() => { this.tickCheckStatus() }, this.checkStatusWorkerTimeout)
        })
      },
      checkAfterSuspended () {
        return this.getSuspendedFiles()
          .then((files) => {
            if (files.length) {
              console.log('\nuploading files with errors after suspend/loses internet connection', files)
              let listener = (event, arg) => {
                this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
                let idToken = arg
                for (let file of files) {
                  return this.$file.checkStatus(file, idToken, true)
                }
              }
              this.$electron.ipcRenderer.send('getIdToken')
              this.$electron.ipcRenderer.on('sendIdToken', listener)
            }
          })
      },
      checkFilesInUploadingSessionId (files) {
        console.log('checkFilesInUploadingSessionId', files)
        if (files.length === 0) return
        const completedFiles = files.filter(file => file.isInCompletedGroup)
        if (files.length === completedFiles.length) { // all files has completed
          this.sendCompleteNotification(completedFiles.length)
          this.resetUploadingSessionId()
        }
      },
      sendCompleteNotification (numberOfCompletedFiles) {
        const text = `${numberOfCompletedFiles} ${numberOfCompletedFiles > 1 ? 'files' : 'file'}`
        let notificationCompleted = {
          title: 'RFCx Ingest',
          body: `${text} uploaded successfully`
        }
        let myNotificationCompleted = new window.Notification(notificationCompleted.title, notificationCompleted)
        myNotificationCompleted.onshow = () => {
          console.log('show notification')
        }
      },
      resetUploadingSessionId () {
        this.$store.dispatch('setCurrentUploadingSessionId', null)
      }
    },
    mounted () {
      let listener = (event, arg) => {
        this.$electron.ipcRenderer.removeListener('suspendApp', listener)
        // Continue uploading process if the app resumes
        this.$store.dispatch('setUploadingProcess', arg)
        this.$electron.ipcRenderer.send('setUploadingProcess', arg)
        if (arg === true) { this.checkAfterSuspended() }
      }
      this.$electron.ipcRenderer.on('suspendApp', listener)
    },
    created () {
      console.log('API Service')
      this.checkAfterSuspended()
      this.checkWaitingFilesInterval = setInterval(() => {
        this.tickUpload()
      }, workerTimeoutMinimum)
      this.tickCheckStatus()
      this.checkFilesInUploadingSessionId(this.filesInUploadingSession)
    },
    beforeDestroy () {
      console.log('\nclearInterval')
      if (this.checkWaitingFilesInterval) {
        clearInterval(this.checkWaitingFilesInterval)
        this.checkWaitingFilesInterval = null
      }
    }
  }
</script>
