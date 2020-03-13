import settings from 'electron-settings'
import api from '../../../utils/api'
import File from '../store/models/File'
import Stream from '../store/models/Stream'
import fileHelper from '../../../utils/fileHelper'
import fileWatcher from '../../../utils/fileWatcher'
import dateHelper from '../../../utils/dateHelper'
import cryptoJS from 'crypto-js'

class FileProvider {
  uploadFile (file, idToken) {
    console.log('\nupload file ', file)
    File.update({ where: file.id,
      data: {state: 'uploading', stateMessage: '0', progress: 0}
    })
    return api.uploadFile(this.isProductionEnv(), file.name, file.path, file.extension, file.streamId, file.timestamp, file.sizeInByte, idToken, (progress) => {
      File.update({ where: file.id,
        data: {state: 'uploading', stateMessage: progress, progress: progress}
      })
    }).then((uploadId) => {
      return File.update({ where: file.id,
        data: {state: 'ingesting', stateMessage: '', uploadId: uploadId, progress: 100}
      })
    }).catch((error) => {
      console.log(error)
      return File.update({ where: file.id,
        data: {state: 'failed', stateMessage: 'Server failed with processing your file. Please try again later.'}
      })
    })
  }

  isProductionEnv () {
    return settings.get('settings.production_env')
  }

  watchingStream (selectedStream) {
    fileWatcher.createWatcher(selectedStream.id, selectedStream.folderPath, (newFilePath) => {
      // try {
      //   let files = await this.getFiles(selectedStream)
      // } catch (error) {
      //   console.log(error)
      // }
      let files = File.query().where('streamId', selectedStream.id).orderBy('name').get()
      if (selectedStream.files && selectedStream.files.length === files.length) {
        if (this.fileIsExist(newFilePath)) return
      } else if (files && files.length) {
        files.forEach((file) => {
          if (!fileHelper.isExist(file.path)) {
            return File.delete(file.id)
          } else {
            if (!file.sha1 || file.sha1 === '') {
              File.update({ where: file.id,
                data: { sha1: fileHelper.getCheckSum(file.path) }
              })
            }
            if (file.sha1 === fileHelper.getCheckSum(newFilePath)) {
              return this.updateFile(file.id, newFilePath)
            }
          }
        })
      }
      if (this.fileIsExist(newFilePath)) return
      console.log('New file for uploading', newFilePath)
      const file = this.createFileObject(newFilePath, selectedStream)
      this.insertFile(file)
      this.insertFilesToStream([file], selectedStream)
    }, (removedFilePath) => {
      this.deleteFile(this.getFileId(removedFilePath))
    })
  }

  async getFiles (selectedStream) {
    return File.query().where('streamId', selectedStream.id).orderBy('name').get()
  }

  async newFilePath (newFilePath, selectedStream) {
    if (this.fileIsExist(newFilePath)) return
    console.log('New file for uploading', newFilePath)
    const file = this.createFileObject(newFilePath, selectedStream)
    await this.insertFile(file)
    await this.insertFilesToStream([file], selectedStream)
  }

  removedFilePath (path) {
    this.deleteFile(this.getFileId(path))
  }

  fileIsExist (filePath) {
    return !!File.find(this.getFileId(filePath))
  }

  createFileObject (filePath, stream) {
    const fileName = fileHelper.getFileNameFromFilePath(filePath)
    const fileExt = fileHelper.getExtension(fileName)
    // const data = fileHelper.getMD5Hash(filePath)
    // const hash = data.hash
    // const sha1 = data.sha1
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
      hash: '',
      sha1: '',
      path: filePath,
      extension: fileExt,
      sizeInByte: size,
      timestamp: isoDate,
      streamId: stream.id,
      state: state.state,
      stateMessage: state.message
    }
  }

  getState (momentDate, fileExt) {
    if (!momentDate.isValid()) {
      return {state: 'failed', message: 'Filename does not match with a filename format'}
    } else if (!fileHelper.isSupportedFileExtension(fileExt)) {
      return {state: 'failed', message: 'File extension is not supported'}
    } else {
      return {state: 'waiting', message: ''}
    }
  }

  getFileId (filePath) {
    return cryptoJS.MD5(filePath).toString()
  }

  async insertFile (file) {
    await File.insert({ data: file })
    console.log('insert file: ', file)
  }

  updateFile (fileId, path) {
    let fileName = fileHelper.getFileNameFromFilePath(path)
    if (fileName) {
      File.update({ where: fileId,
        data: { name: fileName, path: path }
      })
    }
  }

  deleteFile (fileId) {
    console.log('remove file: ', fileId)
    File.delete(fileId)
  }

  async insertFilesToStream (files, stream) {
    await Stream.update({ where: stream.id,
      data: { files: files },
      insert: ['files']
    })
    console.log('insert file to stream')
  }
}

export default new FileProvider()
