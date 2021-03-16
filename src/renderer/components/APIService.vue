<template>
  <div id="wrapper-api-service">API Service</div>
</template>

<script>
  import { mapState } from 'vuex'
  import File from '../store/models/File'
  import Stream from '../store/models/Stream'
  import FileHelper from '../../../utils/fileHelper'
  import FileState from '../../../utils/fileState'
  import DatabaseEventName from './../../../utils/DatabaseEventName'

  const workerTimeoutMinimum = 3000
  const queueFileToUploadWorkerTimeoutMinimum = 1000

  export default {
    data: () => {
      return {
        filesInUploadingQueue: [],
        isHandlingFileNotExist: false,
        isCheckingStatus: false,
        checkWaitingFilesInterval: null,
        checkStatusInterval: null,
        checkSessionInterval: null
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
        this.tickCheckSession() // check status 1 last time before reset uploading id (prevent cannot redo file doesn't exist issue)
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
        if (this.filesInUploadingQueue.includes(unsyncedFile.id)) { console.log('this id is already in queued', unsyncedFile.id); return } // that file is already in the queue
        this.filesInUploadingQueue.push(unsyncedFile.id)
        this.uploadFile(unsyncedFile).then(() => {
          this.filesInUploadingQueue.pop(unsyncedFile.id)
        }).catch(async (error) => {
          if (error.message === 'File does not exist') {
            this.isHandlingFileNotExist = true
            const directoryName = FileHelper.getDirectoryFromFilePath(unsyncedFile.path)
            this.clearFilesDoNotExist(directoryName, unsyncedFile.streamId)
          }
          this.filesInUploadingQueue.pop(unsyncedFile.id)
        })
      },
      queueJobToCheckStatus () {
        if (this.isCheckingStatus) return
        this.isCheckingStatus = true
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
          this.isCheckingStatus = false
        }
        this.$electron.ipcRenderer.on('sendIdToken', listener)
        this.$electron.ipcRenderer.send('getIdToken')
      },
      tickUpload () {
        if (this.isHandlingFileNotExist) { console.log('tickUpload: clearing files that are not exist'); return }
        if (!this.isUploadingProcessEnabled) { console.log('tickUpload: not enable uploading process'); return }
        this.queueFilesToUpload()
      },
      tickCheckStatus () {
        if (this.isHandlingFileNotExist) { console.log('tickCheckStatus: clearing files that are not exist'); return }
        if (!this.isUploadingProcessEnabled) { console.log('tickCheckStatus: not enable uploading process'); return }
        this.queueJobToCheckStatus()
      },
      async tickCheckSession () {
        if (!this.isUploadingProcessEnabled) { console.log('tickCheckSession: not enable uploading process'); return }
        const allFilesInSessionGroupedByStream = File.query().where('sessionId', this.currentUploadingSessionId).get().reduce(function (acc, obj) {
          var key = obj.streamId
          if (!acc[key]) {
            acc[key] = []
          }
          acc[key].push(obj)
          return acc
        }, {})
        if (allFilesInSessionGroupedByStream && Object.keys(allFilesInSessionGroupedByStream).length <= 0) { return }
        for (const [streamId, filesInStream] of Object.entries(allFilesInSessionGroupedByStream)) {
          const canRedo = filesInStream.some(file => file.canRedo)
          await Stream.update({
            where: streamId,
            data: {
              sessionSuccessCount: filesInStream.filter(file => FileState.isCompleted(file.state)).length,
              sessionFailCount: filesInStream.filter(file => FileState.isServerError(file.state)).length,
              sessionTotalCount: filesInStream.length,
              canRedo
            }
          })
        }
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
      clearFilesDoNotExist (directoryName, streamId) {
        const filesInStreamFromTheSameDirectory = File.query().where(file => {
          return file.path.includes(directoryName) && file.isInQueuedGroup && file.streamId === streamId
        }).get()
        let updateFileDoNotExistCompleteListener = async (event) => {
          this.$electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.updateFilesDoNotExistResponse, updateFileDoNotExistCompleteListener)
          // update session count
          await Stream.dispatch('filesCompletedUploadSession', { streamId, amount: filesInStreamFromTheSameDirectory.length, success: false })
          this.isHandlingFileNotExist = false
        }
        this.$electron.ipcRenderer.on(DatabaseEventName.eventsName.updateFilesDoNotExistResponse, updateFileDoNotExistCompleteListener)
        this.$electron.ipcRenderer.send(DatabaseEventName.eventsName.updateFilesDoNotExistRequest, filesInStreamFromTheSameDirectory)
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
      this.checkSessionInterval = setInterval(() => {
        this.tickCheckSession()
      }, 4000)
      this.removeOutdatedFiles()
      // add get file duration listener
      let getFileDurationListener = (event, files) => {
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
      if (this.checkSessionInterval) {
        clearInterval(this.checkSessionInterval)
        this.checkSessionInterval = null
      }
    }
  }
</script>
