<template>
<div id="wrapper">Service</div>
</template>

<script>
  import File from '../store/models/File'
  import API from '../../../utils/api'
  
  export default {
    methods: {
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
      console.log('view has created')
      const unsyncFiles = File.query().where('state', 'waiting').get()
      console.log('unsyncFiles =>', unsyncFiles)
      unsyncFiles.forEach((file) => {
        this.uploadFile(file)
      })
      this.$electron.ipcRenderer.on('hasNewStreamAdded', (event, data) => {
        console.log('on hasNewStreamAdded')
        const unsyncFiles = File.query().where('streamId', data.id).where('state', 'waiting').get()
        unsyncFiles.forEach((file) => {
          this.uploadFile(file)
        })
      })
    }
  }
</script>
