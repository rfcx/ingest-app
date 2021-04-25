<template>
  <div id="wrapper-api-service">API Service</div>
</template>

<script>
  import { mapState } from 'vuex'
  // import File from '../store/models/File'
  // import Stream from '../store/models/Stream'
  // import FileHelper from '../../../utils/fileHelper'
  // import DatabaseEventName from './../../../utils/DatabaseEventName'
  import ipcRendererSend from '../services/ipc'

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
      // numberOfAllFilesInTheSession () {
      //   return Stream.query().sum('sessionTotalCount')
      // },
      // numberOfCompleteFilesInTheSession () {
      //   return this.numberOfSuccessFilesInTheSession + this.numberOfFailFilesInTheSession
      // },
      // numberOfSuccessFilesInTheSession () {
      //   return Stream.query().sum('sessionSuccessCount')
      // },
      // numberOfFailFilesInTheSession () {
      //   return Stream.query().sum('sessionFailCount')
      // },
      // isCompleted () {
      //   return this.numberOfAllFilesInTheSession > 0 && this.numberOfCompleteFilesInTheSession === this.numberOfAllFilesInTheSession
      // }
    },
    // watch: {
    //   async isCompleted (newVal, oldVal) {
    //     if (oldVal === newVal || newVal === false) return
    //     this.sendCompleteNotification(this.numberOfSuccessFilesInTheSession, this.numberOfFailFilesInTheSession)
    //     this.tickCheckSession() // check status 1 last time before reset uploading id (prevent cannot redo file doesn't exist issue)
    //     await this.resetUploadingSessionId()
    //   }
    // },
    methods: {
      getSuspendedFiles () {
        // return new Promise((resolve, reject) => {
        //   let files = File.query().where(file => { return ['uploading', 'converting'].includes(file.state) && file.uploaded === false }).orderBy('timestamp').get()
        //   resolve(files != null ? files : [])
        // })
        return ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { state: ['uploading', 'converting'] } })
          .then((files) => files.filter((file) => !file.uploaded))
      },
      getUnsyncedFile () { // only get files that already have duration to queue to upload
        return ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { state: 'waiting', durationInSecond: { $gt: -1 } }, limit: 1 })
        // return File.query().where('state', 'waiting')
        //   .orderBy('retries', 'desc')
        //   .orderBy('timestamp', 'asc')
        //   .first()
      },
      getUploadedFiles () {
        return ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { state: ['uploading', 'ingesting'] } })
          .then((files) => {
            return files
              .filter((file) => {
                return file.uploadId && file.uploaded
              })
              .slice(0, 5)
          })
        // return File.query().where((file) => {
        //   return ['uploading', 'ingesting'].includes(file.state) && file.uploadId !== '' && file.uploaded === true
        // }).orderBy('timestamp').limit(5).get()
      },
      getNoDurationFiles () { // get duration of files that is in waiting status first
        return ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { state: ['preparing', 'waiting'], durationInSecond: -1 }, order: [['state', 'DESC']], limit: parallelUploads })
        // return File.query().where(file => { return FileHelper.isSupportedFileExtension(file.extension) && file.durationInSecond === -1 && !file.isError }).orderBy('timestamp').get()
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
        console.log('\n\n\n\n\n UPLOAD TRIGGERED', new Date().toISOString(), '\n\n\n')
        return this.uploadFile(unsyncedFile)
          .then(() => {
            console.log('\n\n\n\n\n UPLOAD ENDED', new Date().toISOString(), '\n\n\n')
            this.filesInUploadingQueue.pop(unsyncedFile.id)
          })
          .catch(async (error) => {
            this.filesInUploadingQueue.pop(unsyncedFile.id)
            if (error.message === 'File does not exist') {
              await ipcRendererSend('db.files.update', `db.files.update.${Date.now()}`, {
                id: unsyncedFile.id,
                params: { state: 'server_error', stateMessage: 'File does not exist' }
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
        // if (this.isHandlingFileNotExist) { console.log('tickUpload: clearing files that are not exist'); return }
        if (!this.isUploadingProcessEnabled) { console.log('tickUpload: not enable uploading process'); return }
        this.queueFilesToUpload()
      },
      tickCheckStatus () {
        // if (this.isHandlingFileNotExist) { console.log('tickCheckStatus: clearing files that are not exist'); return }
        if (!this.isUploadingProcessEnabled) { console.log('tickCheckStatus: not enable uploading process'); return }
        this.queueJobToCheckStatus()
      },
      // async updateFilesDuration (files) {
      //   if (files && files.length > 0) {
      //     console.log('update file duration with files params', files.length)
      //     this.$file.updateFilesDuration(files)
      //   } else {
      //     const noDurationFiles = this.getNoDurationFiles()
      //     console.log('update file duration with no duration files from query snapshot', noDurationFiles.length)
      //     this.$file.updateFilesDuration(noDurationFiles)
      //   }
      // },
      // clearFilesDoNotExist (directoryName, streamId) {
      // const filesInStreamFromTheSameDirectory = File.query().where(file => {
      //   return file.path.includes(directoryName) && file.isInQueuedGroup && file.streamId === streamId
      // }).get()
      // let updateFileDoNotExistCompleteListener = async (event) => {
      //   this.$electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.updateFilesDoNotExistResponse, updateFileDoNotExistCompleteListener)
      //   // update session count
      //   await Stream.dispatch('filesCompletedUploadSession', { streamId, amount: filesInStreamFromTheSameDirectory.length, success: false })
      //   this.isHandlingFileNotExist = false
      // }
      // this.$electron.ipcRenderer.on(DatabaseEventName.eventsName.updateFilesDoNotExistResponse, updateFileDoNotExistCompleteListener)
      // this.$electron.ipcRenderer.send(DatabaseEventName.eventsName.updateFilesDoNotExistRequest, filesInStreamFromTheSameDirectory)
      //   this.isHandlingFileNotExist = false
      // },
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
        // this.$electron.ipcRenderer.send(DatabaseEventName.eventsName.deleteOutdatedFilesRequest)
        await ipcRendererSend('db.files.delete', `db.files.delete.${Date.now()}`, {
          where: {
            state: 'completed',
            uploadedTime: {
              '$lt': Date.now() - 1000 * 60 * 60 * 24 * 30
            }
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
      // this.updateFilesDuration()
      this.checkWaitingFilesInterval = setInterval(() => {
        this.tickUpload()
      }, queueFileToUploadWorkerTimeoutMinimum)
      this.checkStatusInterval = setInterval(() => {
        this.tickCheckStatus()
      }, workerTimeoutMinimum)
      setTimeout(() => {
        this.removeOutdatedFiles()
      }, 15000) // wait for 15 seconds to reduce pressure on db on app start
      // add get file duration listener
      // let getFileDurationListener = (event, files) => {
      //   console.log('getFileDurationTrigger')
      //   this.updateFilesDuration(files)
      // }
      // this.$electron.ipcRenderer.on('getFileDurationTrigger', getFileDurationListener)
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
