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

  export default {
    computed: {
      streams () {
        return Stream.query().get()
      }
    },
    watch: {
      streams (val, oldVal) {
        console.log('watch streams changes')
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
        this.streams.forEach(stream => {
          fileWatcher.createWatcher(stream.folderPath, (newFilePath) => {
            if (this.fileIsExist(newFilePath)) return
            let files = File.query().where('streamId', stream.id).orderBy('name').get()
            files.forEach((file) => {
              if (!fileHelper.isExist(file.path)) {
                return File.delete(file.id)
              } else {
                if (fileHelper.getCheckSum(file.path) === fileHelper.getCheckSum(newFilePath)) {
                  return this.updateFile(file.id, newFilePath)
                }
              }
            })
            console.log('New file for uploading', newFilePath)
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
      updateFile (fileId, path) {
        let fileName = fileHelper.getFileNameFromFilePath(path)
        if (fileName) {
          File.update({ where: fileId,
            data: { name: fileName, path: path }
          })
        }
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
    }
  }
</script>
