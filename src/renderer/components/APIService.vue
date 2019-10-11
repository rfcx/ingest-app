<template>
  <div id="wrapper">API Service</div>
</template>

<script>
  import File from '../store/models/File'
  import api from '../../../utils/api'
  
  const workerTimeoutMaximum = 60000
  const workerTimeoutMinimum = 1000

  export default {
    data: () => {
      return {
        workerTimeout: workerTimeoutMinimum
      }
    },
    computed: {
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
      uploadFile (file) {
        console.log('uploadFile: ', file)
        return api.uploadFile(file.path, (progress) => {
          // const updatedFile = {file: file, state: {id: 'uploading', message: progress}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          File.update({ where: file.id,
            data: {state: 'uploading', stateMessage: progress}
          })
        }).then(() => {
          // const updatedFile = {file: file, state: {id: 'completed', message: ''}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          return File.update({ where: file.id,
            data: {state: 'completed', stateMessage: ''}
          })
        }).catch((error) => {
          // const updatedFile = {file: file, state: {id: 'failed', message: error}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          return File.update({ where: file.id,
            data: {state: 'failed', stateMessage: error}
          })
        })
      },
      doWork () {
        return this.getUnsyncedFile().then((file) => {
          return this.uploadFile(file)
        })
      },
      tick () {
        this.doWork().then(() => {
          console.log('job success')
          this.workerTimeout = workerTimeoutMinimum
          setTimeout(() => { this.tick() }, this.workerTimeout)
        }).catch((err) => {
          console.log(err)
          this.workerTimeout = Math.min(2 * this.workerTimeout, workerTimeoutMaximum)
          console.log('job fail, retrying in', this.workerTimeout)
          setTimeout(() => { this.tick() }, this.workerTimeout)
        })
      }
    },
    created () {
      console.log('API Service')
      this.tick()
    }
  }
</script>
