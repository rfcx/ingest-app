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
    methods: {
      getUnsyncFiles (stream) {
        return File.query().where('streamId', stream.id).where('state', 'waiting').get()
      },
      uploadFile (file) {
        API.uploadFile((progress) => {
          // const updatedFile = {file: file, state: {id: 'uploading', message: progress}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          File.update({ where: file.name,
            data: {state: 'uploading', stateMessage: '100'}
          })
        }, () => {
          // const updatedFile = {file: file, state: {id: 'completed', message: ''}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          File.update({ where: file.name,
            data: {state: 'completed', stateMessage: ''}
          })
        }, (error) => {
          // const updatedFile = {file: file, state: {id: 'failed', message: error}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          File.update({ where: file.name,
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
      this.$electron.ipcRenderer.on('hasNewStreamAdded', (event, stream) => {
        console.log('on hasNewStreamAdded')
        const unsyncFiles = this.getUnsyncFiles(stream)
        unsyncFiles.forEach((file) => {
          this.uploadFile(file)
        })
      })
    }
  }
</script>
