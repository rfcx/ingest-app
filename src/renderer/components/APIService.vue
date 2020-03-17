<template>
  <div id="wrapper-api-service">API Service</div>
</template>

<script>
  import { mapState } from 'vuex'
  import File from '../store/models/File'
  import api from '../../../utils/api'
  import settings from 'electron-settings'

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
        isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess
      })
    },
    watch: {
      isUploadingProcessEnabled (val, oldVal) {
        console.log('isUploadingProcessEnabled', val, oldVal)
        if (val === oldVal) return
        this.checkStatusWorkerTimeout = workerTimeoutMinimum
        this.tickUpload()
        this.tickCheckStatus()
      }
    },
    methods: {
      getUploadingFiles () {
        return new Promise((resolve, reject) => {
          let files = File.query().where('state', 'uploading').orderBy('timestamp').get()
          resolve(files != null ? files : [])
        })
      },
      getUnsyncedFile () {
        return new Promise((resolve, reject) => {
          const file = File.query().where('state', 'waiting')
            .orderBy('retries', 'desc')
            .orderBy('timestamp', 'asc')
            .first()
          // const file = File.query().where('state', 'waiting').orderBy('timestamp').first()
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
            return (file.state === 'ingesting' || file.state === 'uploading') && file.uploadId !== ''
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
      checkStatus (file) {
        let listener = (event, arg) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          let idToken = null
          idToken = arg
          return api.checkStatus(this.isProductionEnv(), file.uploadId, idToken)
            .then((data) => {
              const status = data.status
              const failureMessage = data.failureMessage
              console.log('Ingest status = ' + status)
              switch (status) {
                case 10:
                  return File.update({ where: file.id,
                    data: {state: 'ingesting', stateMessage: '', progress: 100}
                  })
                case 19:
                  return File.update({ where: file.id,
                    data: {state: 'ingesting', stateMessage: '', progress: 100}
                  })
                case 20:
                  return File.update({ where: file.id,
                    data: {state: 'completed', stateMessage: '', progress: 100}
                  })
                case 30:
                  if (file.retries < 3) {
                    return File.update({ where: file.id,
                      data: { state: 'waiting', stateMessage: '', retries: file.retries++ }
                    })
                  } else {
                    return File.update({ where: file.id,
                      data: {state: 'failed', stateMessage: failureMessage}
                    })
                  }
                case 31:
                  return File.update({ where: file.id,
                    data: {state: 'duplicated', stateMessage: failureMessage}
                  })
                default: break
              }
            }).catch((error) => {
              console.log(error)
              return File.update({ where: file.id,
                data: {state: 'failed', stateMessage: 'Server failed with processing your file. Please try again later.'}
              })
            })
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
          return this.checkStatus(file)
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
      isProductionEnv () {
        return settings.get('settings.production_env')
      }
    },
    created () {
      console.log('API Service')
      this.checkWaitingFilesInterval = setInterval(() => {
        this.tickUpload()
      }, workerTimeoutMinimum)
      this.tickCheckStatus()
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
