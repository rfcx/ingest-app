<template>
  <div id="wrapper-api-service">API Service</div>
</template>

<script>
  import { mapState } from 'vuex'
  import File from '../store/models/File'
  import FileHelper from '../../../utils/fileHelper'
  import DatabaseEventName from './../../../utils/DatabaseEventName'

  const workerTimeoutMinimum = 3000
  const queueFileToUploadWorkerTimeoutMinimum = 1000

  export default {
    data: () => {
      return {
        numberOfUploadingFiles: 0,
        checkWaitingFilesInterval: null,
        checkStatusInterval: null,
        isQueuing: false
      }
    },
    computed: {
      ...mapState({
        currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId,
        isUploadingProcessEnabled: state => state.AppSetting.isUploadingProcessEnabled
      }),
      filesInUploadingSession () {
        if (!this.currentUploadingSessionId) return []
        return File.query().where('sessionId', this.currentUploadingSessionId).get()
      },
      noDurationFiles () {
        return File.query().where(file => { return FileHelper.isSupportedFileExtension(file.extension) && file.durationInSecond === -1 }).orderBy('timestamp').get()
      }
    },
    watch: {
      isUploadingProcessEnabled (val, oldVal) {
        console.log('isUploadingProcessEnabled set', val, oldVal)
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
          let files = File.query().where(file => { return ['uploading', 'converting'].includes(file.state) && file.uploaded === false }).orderBy('timestamp').get()
          resolve(files != null ? files : [])
        })
      },
      getUnsyncedFile () {
        return File.query().where('state', 'waiting')
          .orderBy('retries', 'desc')
          .orderBy('timestamp', 'asc')
          .first()
      },
      getUploadedFiles () {
        return File.query().where((file) => {
          return ['uploading', 'ingesting'].includes(file.state) && file.uploadId !== '' && file.uploaded === true
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
      queueFilesToUpload () {
        if (this.numberOfUploadingFiles >= 5) return
        const unsyncedFile = this.getUnsyncedFile()
        if (!unsyncedFile) return
        this.numberOfUploadingFiles += 1
        this.uploadFile(unsyncedFile).then(() => {
          this.numberOfUploadingFiles -= 1
        }).catch(() => {
          this.numberOfUploadingFiles -= 1
        })
      },
      queueJobToCheckStatus () {
        let listener = async (event, idToken) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          const files = this.getUploadedFiles()
          for (let file of files) {
            try {
              await this.$file.checkStatus(file, idToken, false)
              // TODO: what happen if the ingest service never ingest/change the status
            } catch (e) {
              console.log('checkStatus failed', e)
            }
          }
        }
        this.$electron.ipcRenderer.on('sendIdToken', listener)
        this.$electron.ipcRenderer.send('getIdToken')
      },
      tickUpload () {
        if (!this.isUploadingProcessEnabled) return
        this.queueFilesToUpload()
      },
      tickCheckStatus () {
        if (!this.isUploadingProcessEnabled) return
        this.queueJobToCheckStatus()
      },
      async updateFilesDuration (files) {
        if (files && files.length > 0) {
          console.log('update file duration with files params', files.length)
          this.$file.updateFilesDuration(files)
        } else {
          const noDurationFiles = this.noDurationFiles
          console.log('update file duration with no duration files from query snapshot', noDurationFiles.length)
          this.$file.updateFilesDuration(noDurationFiles)
        }
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
        if (files.length === 0) return
        const completedFiles = files.filter(file => file.isInCompletedGroup && !file.isError)
        const failedFiles = files.filter(file => file.isInCompletedGroup && file.isError)
        if (files.length === completedFiles.length + failedFiles.length) { // all files has completed
          this.sendCompleteNotification(completedFiles.length, failedFiles.length)
          this.resetUploadingSessionId()
        }
      },
      async removeOutdatedFiles () {
        this.$electron.ipcRenderer.send(DatabaseEventName.eventsName.deleteOutdatedFilesRequest)
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
    created () {
      console.log('API Service')
      this.checkAfterSuspended()
      this.updateFilesDuration()
      this.checkWaitingFilesInterval = setInterval(() => {
        this.tickUpload()
      }, queueFileToUploadWorkerTimeoutMinimum)
      this.checkStatusInterval = setInterval(() => {
        this.tickCheckStatus()
      }, workerTimeoutMinimum)
      this.checkFilesInUploadingSessionId(this.filesInUploadingSession)
      this.removeOutdatedFiles()
      // add get file duration listener
      let getFileDurationListener = (event, files) => {
        this.$electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.putFilesIntoUploadingQueueResponse, getFileDurationListener)
        console.log('getFileDurationTrigger')
        this.updateFilesDuration(files)
      }
      this.$electron.ipcRenderer.on('getFileDurationTrigger', getFileDurationListener)
    },
    beforeDestroy () {
      console.log('\nclearInterval')
      if (this.checkWaitingFilesInterval) {
        clearInterval(this.checkWaitingFilesInterval)
        this.checkWaitingFilesInterval = null
      }
      if (this.checkStatusInterval) {
        clearInterval(this.checkStatusInterval)
        this.checkStatusInterval = null
      }
    }
  }
</script>
