import settings from 'electron-settings'
import api from '../../../utils/api'
import File from '../store/models/File'
import Stream from '../store/models/Stream'
import fileHelper from '../../../utils/fileHelper'
import dateHelper from '../../../utils/dateHelper'
import cryptoJS from 'crypto-js'

class FileProvider {
  uploadFile (file, idToken) {
    console.log('\nupload file ', file)
    if (!fileHelper.isExist(file.path)) {
      return File.update({ where: file.id,
        data: {state: 'local_error', stateMessage: 'File is not exist'}
      })
    }
    return api.uploadFile(this.isProductionEnv(), file.id, file.name, file.path, file.extension, file.streamId, file.timestamp,
      file.sizeInByte, idToken, (progress) => {
      // FIX progress scale when we will start work with google cloud
        File.update({ where: file.id,
          data: {state: 'uploading'}
        })
      }).then((uploadId) => {
      console.log('\nfile uploaded to the temp folder S3')
      File.update({ where: file.id, data: {uploaded: true} })
    }).catch((error) => {
      console.log('ERROR UPLOAD FILE', error, error.message)
      if (error.message === 'Request body larger than maxBodyLength limit') {
        return File.update({ where: file.id,
          data: {state: 'server_error', stateMessage: 'File size exceeded. Maximum file size is 200 MB'}
        })
      } else if (file.retries < 3) {
        return File.update({ where: file.id,
          data: { state: 'waiting', uploadId: '', stateMessage: '', progress: 0, retries: file.retries + 1 }
        })
      } else if (error.message === 'write EPIPE' || error.message === 'read ECONNRESET' || error.message === 'Network Error' || error.message.includes('ETIMEDOUT' || '400')) {
        return File.update({ where: file.id,
          data: {state: 'server_error', stateMessage: 'Network Error'}
        })
      } else {
        return File.update({ where: file.id,
          data: {state: 'server_error', stateMessage: 'Server failed with processing your file. Please try again later.'}
        })
      }
    })
  }

  isProductionEnv () {
    return settings.get('settings.production_env')
  }

  async getFiles (selectedStream) {
    return File.query().where('streamId', selectedStream.id).orderBy('name').get()
  }

  async newFilePath (newFilePath, selectedStream) {
    if (this.fileIsExist(newFilePath)) return
    console.log('New file for uploading', newFilePath)
    const file = await this.createFileObject(newFilePath, selectedStream)
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

  async createFileObject (filePath, stream) {
    const fileName = fileHelper.getFileNameFromFilePath(filePath)
    const fileExt = fileHelper.getExtension(fileName)
    // const data = fileHelper.getMD5Hash(filePath)
    // const hash = data.hash
    // const sha1 = data.sha1
    const size = fileHelper.getFileSize(filePath)
    const duration = await fileHelper.getFileDuration(filePath)
    let isoDate
    if (stream.timestampFormat === 'Auto-detect') {
      isoDate = dateHelper.parseTimestampAuto(fileName)
    } else {
      isoDate = dateHelper.parseTimestamp(fileName, stream.timestampFormat)
    }
    const momentDate = dateHelper.getMomentDateFromISODate(isoDate)
    const state = this.getState(momentDate, fileExt)
    console.log('createFileObject, stream.id', stream.id)
    return {
      id: this.getFileId(filePath),
      name: fileName,
      hash: '',
      sha1: '',
      path: filePath,
      extension: fileExt,
      sizeInByte: size,
      durationInSecond: duration,
      timestamp: isoDate,
      streamId: stream.id,
      state: state.state,
      stateMessage: state.message
    }
  }

  getState (momentDate, fileExt) {
    if (!momentDate.isValid()) {
      return {state: 'local_error', message: 'Filename does not match with a filename format'}
    } else if (!fileHelper.isSupportedFileExtension(fileExt)) {
      return {state: 'local_error', message: 'File extension is not supported'}
    } else {
      return {state: 'preparing', message: ''}
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

  // This function supports only @vuex-orm/core@0.32.2 version.
  async insertFilesToStream (files, stream) {
    await Stream.update({ where: stream.id,
      data: { files: files },
      insert: ['files']
    })
    console.log('insert files to stream:', files)
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
            if (failureMessage.includes('is zero')) {
              return File.update({ where: file.id,
                data: {state: 'server_error', stateMessage: 'Corrupted file'}
              })
            } else if (file.retries < 3) {
              return File.update({ where: file.id,
                data: { state: 'waiting', uploadId: '', stateMessage: '', progress: 0, retries: file.retries + 1 }
              })
            } else {
              return File.update({ where: file.id,
                data: {state: 'server_error', stateMessage: failureMessage}
              })
            }
          case 31:
            return File.update({ where: file.id,
              data: {state: 'server_error', stateMessage: failureMessage}
            })
          default: break
        }
      }).catch((error) => {
        console.log('error', error)
      })
  }
}

export default new FileProvider()
