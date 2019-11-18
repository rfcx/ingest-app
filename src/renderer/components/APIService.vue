<template>
  <div id="wrapper-api-service">API Service</div>
</template>

<script>
  import { mapState } from 'vuex'
  import File from '../store/models/File'
  import api from '../../../utils/api'
  import settings from 'electron-settings'

  const workerTimeoutMaximum = 10000
  const workerTimeoutMinimum = 1000

  export default {
    data: () => {
      return {
        uploadWorkerTimeout: workerTimeoutMinimum,
        checkStatusWorkerTimeout: workerTimeoutMinimum
      }
    },
    computed: {
      ...mapState({
        selectedStreamId: state => state.Stream.selectedStreamId,
        isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess
      }),
      allUnsyncFiles () {
        return File.query().where('state', 'waiting').get()
      }
    },
    watch: {
      allUnsyncFiles (val, oldVal) {
        // console.log('allUnsyncFiles changed', val)
        // const oldIds = oldVal.map((file) => { return file.id })
        // const newIds = val.map((file) => { return file.id })
        // if (JSON.stringify(oldIds) === JSON.stringify(newIds)) return // do nothing if the data is the same
        // val.forEach(file => {
        //   this.uploadFile(file)
        // })
      },
      isUploadingProcessEnabled (val, oldVal) {
        console.log('isUploadingProcessEnabled', val, oldVal)
        if (val === oldVal) return
        this.uploadWorkerTimeout = workerTimeoutMinimum
        this.checkStatusWorkerTimeout = workerTimeoutMinimum
        this.tickUpload()
        this.tickCheckStatus()
      }
    },
    methods: {
      getUnsyncedFile () {
        return new Promise((resolve, reject) => {
          const file = File.query().where('state', 'waiting').orderBy('timestamp').first()
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
            return file.state === 'ingesting' && file.uploadId !== ''
          }).orderBy('timestamp').first()
          if (file != null) {
            resolve(file)
          } else {
            reject(new Error('No uploaded files'))
          }
        })
      },
      uploadFile (file) {
        File.update({ where: file.id,
          data: {state: 'uploading', stateMessage: '0', progress: 0}
        })
        return api.uploadFile(this.isProductionEnv(), file.name, file.path, file.extension, file.streamId, file.timestamp, (progress) => { // TODO: fix stream id
          // const updatedFile = {file: file, state: {id: 'uploading', message: progress}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          File.update({ where: file.id,
            data: {state: 'uploading', stateMessage: progress, progress: progress}
          })
        }).then((uploadId) => {
          // const updatedFile = {file: file, state: {id: 'completed', message: ''}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          console.log('==== uploadFile succes', uploadId)
          return File.update({ where: file.id,
            data: {state: 'ingesting', stateMessage: '', uploadId: uploadId, progress: 100}
          })
        }).catch((error) => {
          // const updatedFile = {file: file, state: {id: 'failed', message: error}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          return File.update({ where: file.id,
            data: {state: 'failed', stateMessage: error.message}
          })
        })
      },
      checkStatus (file) {
        return api.checkStatus(this.isProductionEnv(), file.uploadId)
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
                return File.update({ where: file.id,
                  data: {state: 'failed', stateMessage: failureMessage}
                })
              default: break
            }
          }).catch((error) => {
            console.log(error)
            return File.update({ where: file.id,
              data: {state: 'failed', stateMessage: error.message}
            })
          })
      },
      queueFileToUpload () {
        return this.getUnsyncedFile().then((file) => {
          return this.uploadFile(file)
        })
      },
      queueJobToCheckStatus () {
        return this.getUploadedFile().then((file) => {
          return this.checkStatus(file)
        })
      },
      tickUpload () {
        if (!this.isUploadingProcessEnabled) return
        this.queueFileToUpload().then(() => {
          console.log('job success')
          this.uploadWorkerTimeout = workerTimeoutMinimum
          setTimeout(() => { this.tickUpload() }, this.uploadWorkerTimeout)
        }).catch((err) => {
          console.log(err)
          this.uploadWorkerTimeout = Math.min(2 * this.uploadWorkerTimeout, workerTimeoutMaximum)
          console.log('job fail, retrying in', this.uploadWorkerTimeout)
          setTimeout(() => { this.tickUpload() }, this.uploadWorkerTimeout)
        })
      },
      tickCheckStatus () {
        if (!this.isUploadingProcessEnabled) return
        this.queueJobToCheckStatus().then(() => {
          console.log('job success')
          this.checkStatusWorkerTimeout = workerTimeoutMinimum
          setTimeout(() => { this.tickCheckStatus() }, this.checkStatusWorkerTimeout)
        }).catch((err) => {
          console.log(err)
          this.checkStatusWorkerTimeout = Math.min(2 * this.checkStatusWorkerTimeout, workerTimeoutMaximum)
          console.log('job fail, retrying in', this.checkStatusWorkerTimeout)
          setTimeout(() => { this.tickCheckStatus() }, this.checkStatusWorkerTimeout)
        })
      },
      isProductionEnv () {
        return settings.get('settings.production_env')
      }
    },
    created () {
      console.log('API Service')
      // uploading
      this.tickUpload()
      // ingesting
      this.tickCheckStatus()
    }
  }
</script>
