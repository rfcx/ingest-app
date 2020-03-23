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
    return api.uploadFile(this.isProductionEnv(), file.id, file.name, file.path, file.extension, file.streamId, file.timestamp,
      file.sizeInByte, idToken, (progress) => {
      // FIX progress scale when we will start work with google cloud
      // File.update({ where: file.id,
      //   data: {state: 'uploading', stateMessage: progress, progress: progress}
      // })
      }).then((uploadId) => {
      console.log('\nfile uploaded to the temp folder S3')
      File.update({ where: file.id, data: {uploaded: true} })
    }).catch((error) => {
      console.log('ERROR UPLOAD FILE', error, error.message)
      if (error.message === 'Request body larger than maxBodyLength limit') {
        return File.update({ where: file.id,
          data: {state: 'failed', stateMessage: 'File size exceeded. Maximum file size is 200 MB'}
        })
      } else if (file.retries < 3) {
        return File.update({ where: file.id,
          data: { state: 'waiting', uploadId: '', stateMessage: '', progress: 0, retries: file.retries++ }
        })
      } else if (error.message === 'write EPIPE' || error.message === 'read ECONNRESET' || error.message === 'Network Error' || error.message.includes('ETIMEDOUT' || '400')) {
        return File.update({ where: file.id,
          data: {state: 'failed', stateMessage: 'Network Error'}
        })
      } else {
        return File.update({ where: file.id,
          data: {state: 'failed', stateMessage: 'Server failed with processing your file. Please try again later.'}
        })
      }
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

  async insertNewFiles (files, selectedStream) {
    await this.insertFiles(files)
    await this.insertFilesToStream(files, selectedStream)
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

  async insertFiles (files) {
    await File.insert({ data: files })
    console.log('insert files: ', files)
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

  checkStatus (file, idToken, isSuspended) {
    return api.checkStatus(this.isProductionEnv(), file.uploadId, idToken)
      .then((data) => {
        const status = data.status
        const failureMessage = data.failureMessage
        console.log('Ingest status = ' + status)
        switch (status) {
          case 0:
            if (isSuspended) {
              // If the app suspends/loses internet connection the uploading file changes the status to waiting
              return File.update({ where: file.id,
                data: {state: 'waiting', uploadId: '', stateMessage: '', progress: 0, retries: 0}
              })
            }
            return
          case 10:
            return File.update({ where: file.id,
              data: {state: 'ingesting', stateMessage: '', progress: 100}
            })
          case 20:
            return File.update({ where: file.id,
              data: {state: 'completed', stateMessage: '', progress: 100}
            })
          case 30:
            if (file.retries < 3) {
              return File.update({ where: file.id,
                data: { state: 'waiting', uploadId: '', stateMessage: '', progress: 0, retries: file.retries++ }
              })
            } else {
              return File.update({ where: file.id,
                data: {state: 'failed', stateMessage: failureMessage}
              })
            }
          case 31:
            return File.update({ where: file.id,
              data: {state: 'duplicated', stateMessage: failureMessage}
            })
          default: break
        }
      }).catch((error) => {
        console.log('error', error)
      })
  }
}

export default new FileProvider()
