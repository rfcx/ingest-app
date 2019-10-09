<template>
<div id="wrapper">API Service</div>
</template>

<script>
  import File from '../store/models/File'
  import API from '../../../utils/api'
  
  export default {
    computed: {
      allUnsyncFiles () {
        return File.query().where('state', 'waiting').get()
      }
    },
    watch: {
      allUnsyncFiles (val, oldVal) {
        console.log('allUnsyncFiles changed', val)
        const oldIds = oldVal.map((file) => { return file.id })
        const newIds = val.map((file) => { return file.id })
        if (JSON.stringify(oldIds) === JSON.stringify(newIds)) return // do nothing if the data is the same
        val.forEach(file => {
          this.uploadFile(file)
        })
      }
    },
    methods: {
      getUnsyncFiles (stream) {
        return File.query().where('streamId', stream.id).where('state', 'waiting').get()
      },
      uploadFile (file) {
        console.log('uploadFile: ', file)
        return API.uploadFile(file.path, (progress) => {
          // const updatedFile = {file: file, state: {id: 'uploading', message: progress}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          File.update({ where: file.id,
            data: {state: 'uploading', stateMessage: progress}
          })
        }).then(() => {
          // const updatedFile = {file: file, state: {id: 'completed', message: ''}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          File.update({ where: file.id,
            data: {state: 'completed', stateMessage: ''}
          })
        }).catch((error) => {
          // const updatedFile = {file: file, state: {id: 'failed', message: error}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          File.update({ where: file.id,
            data: {state: 'failed', stateMessage: error}
          })
        })
      }
    },
    created () {
      console.log('API Service')
      const unsyncFiles = this.allUnsyncFiles
      console.log('unsyncFiles =>', unsyncFiles)
      unsyncFiles.forEach((file) => {
        this.uploadFile(file)
      })
    }
  }
</script>
