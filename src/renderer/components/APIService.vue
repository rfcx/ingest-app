<template>
  <div id="wrapper-api-service">API Service</div>
</template>

<script>
  import { mapState } from 'vuex'
  import ipcRendererSend from '../services/ipc'
  import fileState from '../../../utils/fileState'
  const { PREPARING, ERROR_SERVER, CONVERTING, UPLOADING, WAITING, PROCESSING, COMPLETED } = fileState.state

  const workerTimeoutMinimum = 3000
  const queueFileToUploadWorkerTimeoutMinimum = 1000
  const parallelUploads = 10

  export default {
    data: () => {
      return {
        filesInUploadingQueue: [],
        isHandlingFileNotExist: false,
        isCheckingStatus: false,
        isCalculatingDurations: false,
        checkWaitingFilesInterval: null,
        checkStatusInterval: null,
        checkSessionInterval: null,
        checkCalcDurationInterval: null
      }
    },
    computed: {
      ...mapState({
        currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId,
        isUploadingProcessEnabled: state => state.AppSetting.isUploadingProcessEnabled
      })
    },
    methods: {
      getSuspendedFiles () {
        return ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { state: [UPLOADING, CONVERTING] } })
          .then((files) => files.filter((file) => !file.uploaded))
      },
      getUnsyncedFile () { // only get files that already have duration to queue to upload
        return ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { state: WAITING, durationInSecond: { $gt: -1 } }, limit: 1 })
      },
      getUploadedFiles () {
        return ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { state: [UPLOADING, PROCESSING] } })
          .then((files) => {
            return files
              .filter((file) => {
                return file.uploadId && file.uploaded
              })
              .slice(0, 5)
          })
      },
      getNoDurationFiles () { // get duration of files that is in waiting status
        return ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { state: [PREPARING, WAITING], durationInSecond: [-1] }, order: [['state', 'DESC'], ['createdAt', 'ASC']], limit: parallelUploads })
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
      async queueFilesToUpload () {
        if (this.filesInUploadingQueue.length > parallelUploads) return
        const unsyncedFiles = await this.getUnsyncedFile()
        const unsyncedFile = unsyncedFiles[0]
        if (!unsyncedFile) return // no unsync file
        if (unsyncedFile.durationInSecond <= 0) {
          console.log('this file does not have duration yet', unsyncedFile.id)
          return
        }
        if (this.filesInUploadingQueue.includes(unsyncedFile.id)) { // that file is already in the queue
          console.log('this id is already in queue', unsyncedFile.id)
          return
        }
        this.filesInUploadingQueue.push(unsyncedFile.id)
        return this.uploadFile(unsyncedFile)
          .then(() => {
            this.filesInUploadingQueue.pop(unsyncedFile.id)
          })
          .catch(async (error) => {
            this.filesInUploadingQueue.pop(unsyncedFile.id)
            if (error.message === 'File does not exist') {
              await ipcRendererSend('db.files.update', `db.files.update.${Date.now()}`, {
                id: unsyncedFile.id,
                params: { state: ERROR_SERVER, stateMessage: 'File does not exist' }
              })
            }
          })
      },
      queueJobToCheckStatus () {
        if (this.isCheckingStatus) return
        this.isCheckingStatus = true
        let listener = async (event, idToken) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          const files = await this.getUploadedFiles()
          for (let file of files) {
            try {
              await this.$file.checkStatus(file, idToken, false)
              // TODO: what happen if the ingest service never ingest/change the status
            } catch (e) {
              console.log('checkStatus failed', e)
            }
          }
          this.isCheckingStatus = false
        }
        this.$electron.ipcRenderer.on('sendIdToken', listener)
        this.$electron.ipcRenderer.send('getIdToken')
      },
      async tickCalcDuration () {
        if (this.isCalculatingDurations) { return }
        this.isCalculatingDurations = true
        const files = await this.getNoDurationFiles()
        if (files && files.length) {
          await this.$file.updateFilesDuration(files)
        } else {
          this.stopCalcDurationTick()
        }
        this.isCalculatingDurations = false
      },
      tickUpload () {
        if (!this.isUploadingProcessEnabled) { console.log('tickUpload: not enable uploading process'); return }
        this.queueFilesToUpload()
      },
      tickCheckStatus () {
        if (!this.isUploadingProcessEnabled) { console.log('tickCheckStatus: not enable uploading process'); return }
        this.queueJobToCheckStatus()
      },
      checkAfterSuspended () {
        return this.getSuspendedFiles()
          .then((files) => {
            if (files.length) {
              console.log('\nuploading files with errors after suspend/loses internet connection', files.length)
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
        await ipcRendererSend('db.files.delete', `db.files.delete.${Date.now()}`, {
          where: {
            state: COMPLETED,
            uploadedTime: {
              '$lt': Date.now() - 1000 * 60 * 60 * 24 * 30
            }
          }
        })
      },
      async removeEmptyFileInTheQueue () {
        await ipcRendererSend('db.files.delete', `db.files.delete.${Date.now()}`, {
          where: {
            state: WAITING,
            durationInSecond: -2
          }
        })
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
      startCalcDurationTick () {
        if (this.checkCalcDurationInterval) { return }
        this.checkCalcDurationInterval = setInterval(this.tickCalcDuration.bind(this), queueFileToUploadWorkerTimeoutMinimum)
      },
      stopCalcDurationTick () {
        if (this.checkCalcDurationInterval) {
          clearInterval(this.checkCalcDurationInterval)
          this.checkCalcDurationInterval = null
        }
      }
    },
    created () {
      console.log('API Service')
      this.checkAfterSuspended()
      this.startCalcDurationTick()
      this.checkWaitingFilesInterval = setInterval(() => {
        this.tickUpload()
      }, queueFileToUploadWorkerTimeoutMinimum)
      this.checkStatusInterval = setInterval(() => {
        this.tickCheckStatus()
      }, workerTimeoutMinimum)
      setTimeout(() => {
        this.removeOutdatedFiles()
        this.removeEmptyFileInTheQueue()
      }, 15000) // wait for 15 seconds to reduce pressure on db on app start
      // listen to file server for any new files added
      this.$electron.ipcRenderer.on('services.file.new', this.startCalcDurationTick.bind(this))
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
      if (this.checkSessionInterval) {
        clearInterval(this.checkSessionInterval)
        this.checkSessionInterval = null
      }
      this.stopCalcDurationTick()
    }
  }
</script>
