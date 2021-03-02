<template>
  <div id="wrapper-api-service">API Service</div>
</template>

<script>
  import { mapState } from 'vuex'
  import File from '../store/models/File'
  import Stream from '../store/models/Stream'
  import FileHelper from '../../../utils/fileHelper'
  import DatabaseEventName from './../../../utils/DatabaseEventName'

  const workerTimeoutMinimum = 3000
  const queueFileToUploadWorkerTimeoutMinimum = 1000

  export default {
    data: () => {
      return {
        filesInUploadingQueue: [],
        isCheckingStatus: false,
        checkWaitingFilesInterval: null,
        checkStatusInterval: null
      }
    },
    computed: {
      ...mapState({
        currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId,
        isUploadingProcessEnabled: state => state.AppSetting.isUploadingProcessEnabled
      }),
      numberOfAllFilesInTheSession () {
        return Stream.query().sum('sessionTotalCount')
      },
      numberOfCompleteFilesInTheSession () {
        return this.numberOfSuccessFilesInTheSession + this.numberOfFailFilesInTheSession
      },
      numberOfSuccessFilesInTheSession () {
        return Stream.query().sum('sessionSuccessCount')
      },
      numberOfFailFilesInTheSession () {
        return Stream.query().sum('sessionFailCount')
      },
      isCompleted () {
        return this.numberOfAllFilesInTheSession > 0 && this.numberOfCompleteFilesInTheSession === this.numberOfAllFilesInTheSession
      }
    },
    watch: {
      async isCompleted (newVal, oldVal) {
        if (oldVal === newVal || newVal === false) return
        this.sendCompleteNotification(this.numberOfSuccessFilesInTheSession, this.numberOfFailFilesInTheSession)
        await this.resetUploadingSessionId()
      }
    },
    methods: {
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
      getNoDurationFiles () {
        return File.query().where(file => { return FileHelper.isSupportedFileExtension(file.extension) && file.durationInSecond === -1 && !file.isError }).orderBy('timestamp').get()
      },
      async uploadFile (file) {
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
        if (this.filesInUploadingQueue.length >= 5) return
        const unsyncedFile = this.getUnsyncedFile()
        if (!unsyncedFile) return // no unsync file
        if (this.filesInUploadingQueue.includes(unsyncedFile.id)) return // that file is already in the queue
        this.filesInUploadingQueue.push(unsyncedFile.id)
        this.uploadFile(unsyncedFile).then(() => {
          this.filesInUploadingQueue.pop(unsyncedFile.id)
        }).catch(() => {
          this.filesInUploadingQueue.pop(unsyncedFile.id)
        })
      },
      queueJobToCheckStatus () {
        if (this.isCheckingStatus) return
        this.isCheckingStatus = true
        let listener = async (event, idToken) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          const files = this.getUploadedFiles()
          console.log('check status for', files.map(file => file.name))
          for (let file of files) {
            try {
              await this.$file.checkStatus(file, idToken, false)
              // TODO: what happen if the ingest service never ingest/change the status
            } catch (e) {
              console.log('checkStatus failed', e)
            }
          }
          console.log('check status finish')
          this.isCheckingStatus = false
        }
        this.$electron.ipcRenderer.on('sendIdToken', listener)
        this.$electron.ipcRenderer.send('getIdToken')
      },
      tickUpload () {
        if (!this.isUploadingProcessEnabled) { console.log('tickUpload: not enable uploading process'); return }
        this.queueFilesToUpload()
      },
      tickCheckStatus () {
        if (!this.isUploadingProcessEnabled) { console.log('tickCheckStatus: not enable uploading process'); return }
        this.queueJobToCheckStatus()
      },
      async updateFilesDuration (files) {
        if (files && files.length > 0) {
          console.log('update file duration with files params', files.length)
          this.$file.updateFilesDuration(files)
        } else {
          const noDurationFiles = this.getNoDurationFiles()
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
      async resetUploadingSessionId () {
        await Stream.dispatch('resetSession')
        await this.$store.dispatch('setCurrentUploadingSessionId', null)
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
