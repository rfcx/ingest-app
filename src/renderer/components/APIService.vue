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
        checkWaitingFilesInterval: null,
        isQueuing: false
      }
    },
    computed: {
      ...mapState({
        currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId
      }),
      filesInUploadingSession () {
        if (!this.currentUploadingSessionId) return []
        return File.query().where('sessionId', this.currentUploadingSessionId).get()
      },
      noDurationFiles () {
        return File.query().where(file => { return file.state === 'preparing' && file.durationInSecond === -1 }).orderBy('timestamp').get()
      },
      isUploadingProcessEnabled () {
        const files = this.getAllFilesInTheSession()
        return files.every(file => { return !file.paused })
      }
    },
    watch: {
      isUploadingProcessEnabled (val, oldVal) {
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
      getAllFilesInTheSession () {
        return File.query().where('sessionId', this.currentUploadingSessionId).get()
      },
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
      getUnsyncedFiles () {
        return File.query().where('state', 'waiting')
          .orderBy('retries', 'desc')
          .orderBy('timestamp', 'asc')
          .limit(10).get()
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
      getUploadedFiles () {
        return File.query().where((file) => {
          return (file.state === 'ingesting' || file.state === 'uploading') && file.uploadId !== '' && file.uploaded === true
        }).orderBy('timestamp').limit(5).get()
      },
      uploadFile (file) {
        return new Promise((resolve, reject) => {
          let listener = (event, arg) => {
            this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
            let idToken = null
            idToken = arg
            return this.$file.uploadFile(file, idToken).then(resolve).catch(reject)
          }
          this.$electron.ipcRenderer.send('getIdToken')
          this.$electron.ipcRenderer.on('sendIdToken', listener)
        })
      },
      // queue 10 files to upload each time
      queueFilesToUpload () {
        const unsyncedFiles = this.getUnsyncedFiles()
        if (unsyncedFiles.length <= 0 || this.isQueuing) { return }
        this.isQueuing = true
        return Promise.all(unsyncedFiles.map((file) => this.uploadFile(file))).then(() => {
          this.isQueuing = false
        }).catch((err) => {
          this.isQueuing = false
          console.log(err)
        })
      },
      queueJobToCheckStatus () {
        return this.getUploadedFile().then((file) => {
          let listener = (event, arg) => {
            this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
            let idToken = arg
            return Promise.all(this.getUploadedFiles().map(file => this.$file.checkStatus(file, idToken, false)))
          }
          this.$electron.ipcRenderer.send('getIdToken')
          this.$electron.ipcRenderer.on('sendIdToken', listener)
        })
      },
      tickUpload () {
        if (!this.isUploadingProcessEnabled) return
        this.queueFilesToUpload()
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
      async updateFilesDuration () {
        this.$file.updateFilesDuration(this.noDurationFiles)
      },
      checkAfterSuspended () {
        return this.getSuspendedFiles()
          .then((files) => {
            if (files.length) {
              console.log('\nuploading files with errors after suspend/loses internet connection', files)
              let listener = (event, arg) => {
                this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
                let idToken = arg
                return files.forEach(file => {
                  return this.$file.checkStatus(file, idToken, true)
                })
              }
              this.$electron.ipcRenderer.send('getIdToken')
              this.$electron.ipcRenderer.on('sendIdToken', listener)
            }
          })
      },
      checkFilesInUploadingSessionId (files) {
        console.log('checkFilesInUploadingSessionId', files)
        if (files.length === 0) return
        const completedFiles = files.filter(file => file.isInCompletedGroup && !file.isError)
        const failedFiles = files.filter(file => file.isInCompletedGroup && file.isError)
        if (files.length === completedFiles.length + failedFiles.length) { // all files has completed
          this.sendCompleteNotification(completedFiles.length, failedFiles.length)
          this.resetUploadingSessionId()
        }
      },
      sendCompleteNotification (numberOfCompletedFiles, numberOfFailedFiles) {
        const completedText = `${numberOfCompletedFiles} ${numberOfCompletedFiles > 1 ? 'files' : 'file'} uploaded`
        const failText = `${numberOfFailedFiles} ${numberOfFailedFiles > 1 ? 'files' : 'file'} failed`
        let notificationCompleted = {
          title: 'Ingest Completed',
          body: `${numberOfCompletedFiles > 0 ? completedText : ''} ${numberOfFailedFiles > 0 ? failText : ''}`
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
        const files = this.getAllFilesInTheSession()
        files.forEach(file => {
          File.update({ where: file.id,
            data: { paused: !arg }
          })
        })
        this.$electron.ipcRenderer.send('setUploadingProcess', arg)
        if (arg === true) { this.checkAfterSuspended() }
      }
      this.$electron.ipcRenderer.on('suspendApp', listener)
    },
    created () {
      console.log('API Service')
      this.checkAfterSuspended()
      this.updateFilesDuration()
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
