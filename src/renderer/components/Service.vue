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
            data: {state: {id: 'uploading', message: '100'}}
          })
        }, () => {
          // const updatedFile = {file: file, state: {id: 'completed', message: ''}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          File.update({ where: file.name,
            data: {state: {id: 'completed', message: ''}}
          })
        }, (error) => {
          // const updatedFile = {file: file, state: {id: 'failed', message: error}}
          // this.$electron.ipcRenderer.send('updateProgress', updatedFile)
          File.update({ where: file.name,
            data: {state: {id: 'failed', message: error}}
          })
        })
      }
    },
    created () {
      console.log('view has created')
      const unsyncFiles = File.query().where('state', 'waiting').get()
      console.log(unsyncFiles)
      const files = File.all()
      files.forEach((file) => {
        this.uploadFile(file)
      })
      // this.$electron.ipcRenderer.on('updateProgress', (event, data) => {
      //   console.log(event)
      //   console.log(data.file)
      //   console.log(data.state)
      //   console.log('updateProgress with state =>' + data.state.id)
      //   File.update({ where: data.file.name,
      //     data: {state: data.state}
      //   })
      // })
      // this.$electron.ipcRenderer.send('queuedUnsyncFiles', files)
    }
  }
</script>
