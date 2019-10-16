<template>
<div id="wrapper">FS Service</div>
</template>

<script>
  import fileHelper from '../../../utils/fileHelper'
  import fileWatcher from '../../../utils/fileWatcher'
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
        this.streams.forEach(stream => {
          fileWatcher.watch(stream.folderPath, (newFilePath) => {
            // add callback
            if (this.fileIsExist(newFilePath)) return
            const file = this.createFileObject(newFilePath, stream)
            this.insertFile(file)
            this.insertFilesToStream([file], stream)
          }, (removedFilePath) => {
            this.deleteFile(this.getFileId(removedFilePath))
          })
        })
      },
      createFileObject (filePath, stream) {
        const fileName = fileHelper.getFileNameFromFilePath(filePath)
        const fileExt = fileHelper.getExtension(fileName)
        const hash = fileHelper.getMD5Hash(filePath)
        const size = fileHelper.getFileSize(filePath)
        const isoDate = dateHelper.getDateTime(fileName, stream.timestampFormat)
        const momentDate = dateHelper.getMomentDateFromISODate(isoDate)
        const state = this.getState(momentDate, fileExt)
        return {
          id: this.getFileId(filePath),
          name: fileName,
          hash: hash,
          path: filePath,
          extension: fileExt,
          sizeInByte: size,
          timestamp: momentDate,
          streamId: stream.id,
          state: state.state,
          stateMessage: state.message
        }
      },
      getState (momentDate, fileExt) {
        if (!momentDate.isValid()) {
          console.log('Filename does not match with a timestamp format')
          return {state: 'failed', message: 'Filename does not match with a timestamp format'}
        } else if (!fileHelper.isSupportedFileExtension(fileExt)) {
          console.log('File extension is not supported')
          return {state: 'failed', message: 'File extension is not supported'}
        } else {
          return {state: 'waiting', message: ''}
        }
      },
      getFileId (filePath) {
        return cryptoJS.MD5(filePath).toString()
      },
      insertFile (file) {
        console.log('insert file: ', file)
        File.insert({ data: file })
      },
      deleteFile (fileId) {
        console.log('remove file: ', fileId)
        File.delete(fileId)
      },
      insertFilesToStream (files, stream) {
        Stream.update({ where: stream.id,
          data: { files: files },
          insert: ['files']
        })
      },
      fileIsExist (filePath) {
        return !!File.find(this.getFileId(filePath))
      }
    },
    created () {
      console.log('FS Service')
      this.subscribeForFileChanges()
      /*
      this.$electron.ipcRenderer.on('hasNewStreamAdded', (event, stream) => {
        const folderPath = stream.folderPath
        console.log('on hasNewStreamAdded path: ', folderPath)
        const files = fileHelper.getFilesFromDirectoryPath(folderPath).map(fileName => {
          const filePath = fileHelper.getFilePath(folderPath, fileName)
          return this.createFileObject(filePath, stream)
        })
        const filesOnly = files.filter(file => { return file.hash !== '' })
        this.insertFilesToStream(filesOnly, stream)
        filesOnly.forEach((file) => {
          this.insertFile(file)
        })
      })
      */
    }
  }
</script>
