<template>
<div id="wrapper-fs-service">FS Service</div>
</template>

<script>
  import fileHelper from '../../../utils/fileHelper'
  import fileWatcher from '../../../utils/fileWatcher'
  import dateHelper from '../../../utils/dateHelper'
  import cryptoJS from 'crypto-js'
  import Stream from '../store/models/Stream'
  import File from '../store/models/File'
  // import { mapState } from 'vuex'

  export default {
    computed: {
      // ...mapState({
      //   isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess
      // }),
      streams () {
        return Stream.query().get()
      }
    },
    watch: {
      streams (val, oldVal) {
        const oldIds = oldVal.map((stream) => { return stream.id })
        const newIds = val.map((stream) => { return stream.id })
        if (JSON.stringify(oldIds) === JSON.stringify(newIds)) return
        this.subscribeForFileChanges()
      }
    },
    methods: {
      subscribeForFileChanges () {
        console.log('subscribeForFileChanges')
        // Subscribe for file changes.
        // if (!this.isUploadingProcessEnabled) return
        this.streams.forEach(stream => {
          fileWatcher.createWatcher(stream.folderPath, (newFilePath) => {
            if (this.fileIsExist(newFilePath)) return
            console.log('New file for uploading: ', newFilePath)
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
        let isoDate
        if (stream.timestampFormat === 'Auto-detect') {
          isoDate = dateHelper.parseTimestampAuto(fileName)
        } else {
          isoDate = dateHelper.parseTimestamp(fileName, stream.timestampFormat)
        }
        const momentDate = dateHelper.getMomentDateFromISODate(isoDate)
        const state = this.getState(momentDate, fileExt)
        return {
          id: this.getFileId(filePath),
          name: fileName,
          hash: hash,
          path: filePath,
          extension: fileExt,
          sizeInByte: size,
          timestamp: isoDate,
          streamId: stream.id,
          state: state.state,
          stateMessage: state.message
        }
      },
      getState (momentDate, fileExt) {
        if (!momentDate.isValid()) {
          return {state: 'failed', message: 'Filename does not match with a filename format'}
        } else if (!fileHelper.isSupportedFileExtension(fileExt)) {
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
        console.log('fileIsExist: ', this.getFileId(filePath))
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
