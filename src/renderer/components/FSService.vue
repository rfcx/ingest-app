<template>
<div id="wrapper">FS Service</div>
</template>

<script>
  import fileHelper from '../../../utils/fileHelper'
  import dateHelper from '../../../utils/dateHelper'
  import cryptoJS from 'crypto-js'
  import Stream from '../store/models/Stream'
  import File from '../store/models/File'
  
  export default {
    computed: {
      streams () {
        return Stream.query().get()
      }
    },
    watch: {
      streams (val, oldVal) {
        const oldIds = oldVal.map((stream) => { return stream.id })
        const newIds = val.map((stream) => { return stream.id })
        if (JSON.stringify(oldIds) === JSON.stringify(newIds)) return // do nothing if the data is the same
        this.subscribeForFileChanges()
      }
    },
    methods: {
      subscribeForFileChanges () {
        console.log('subscribeForFileChanges')
        // TODO: subscribe for file changes
      },
      createFileObject (filePath, stream) {
        const fileName = fileHelper.getFileNameFromFilePath(filePath)
        const hash = fileHelper.getMD5Hash(filePath)
        const isoDate = dateHelper.getDateTime(fileName, stream.timestampFormat)
        const momentDate = dateHelper.getMomentDateFromISODate(isoDate)
        const state = momentDate.isValid() ? 'waiting' : 'failed'
        const stateMessage = momentDate.isValid() ? '' : 'Filename does not match with a timestamp format'
        return {
          id: cryptoJS.MD5(filePath).toString(),
          name: fileName,
          hash: hash,
          timestamp: momentDate,
          streamId: stream.id,
          state: state,
          stateMessage: stateMessage
        }
      },
      insertFile (file) {
        console.log('insert file: ', file)
        File.insert({ data: file })
      },
      insertFilesToStream (files, stream) {
        Stream.update({ where: stream.id,
          data: { files: files },
          insert: ['files']
        })
      }
    },
    created () {
      console.log('FS Service')
      this.$electron.ipcRenderer.on('hasNewStreamAdded', (event, stream) => {
        const folderPath = stream.folderPath
        console.log('on hasNewFilesAdded path: ', folderPath)
        const files = fileHelper.getFilesFromDirectoryPath(folderPath).map(fileName => {
          const filePath = fileHelper.getFilePath(folderPath, fileName)
          return this.createFileObject(filePath, stream)
        })
        const filesOnly = files.filter(file => { return file.hash !== '' })
        this.insertFilesToStream(filesOnly, stream)
        filesOnly.forEach((file) => {
          this.insertFile(file)
        })
        // this.$electron.ipcRenderer.send('readNewFilesSuccess', filesOnly)
      })
    }
  }
</script>
