import electron from 'electron'
import settings from 'electron-settings'
import api from '../../../utils/api'
import fileHelper from '../../../utils/fileHelper'
import dateHelper from '../../../utils/dateHelper'
import FileFormat from '../../../utils/FileFormat'
import cryptoJS from 'crypto-js'
import store from '../store'
import FileInfo from './FileInfo'
import fs from 'fs'
import Analytics from 'electron-ga'
import env from '../../../env.json'
import fileState from '../../../utils/fileState'
import ipcRendererSend from './ipc'

const { PREPARING, ERROR_LOCAL, ERROR_SERVER, WAITING, PROCESSING, COMPLETED } = fileState.state

const FORMAT_AUTO_DETECT = FileFormat.fileFormat.AUTO_DETECT
const analytics = new Analytics(env.analytics.id)

class FileProvider {
  /**
  * Import files
  * @param {FileList} droppedFiles
  * @param {Stream} selectedStream
  */
  async handleDroppedFiles (droppedFiles, selectedStream, deploymentInfo = null) {
    if (droppedFiles.length === 0) {
      return
    }

    // Convert dropped files (from drag&drop) to database file objects
    const t0 = performance.now()
    let fileObjects = []
    let fileObjectsInFolder = []
    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i]
      if (fileHelper.isFolder(file.path)) {
        fileObjectsInFolder = fileObjectsInFolder.concat(
          this.getFileObjectsFromFolder(file.path, selectedStream, null)
        ).filter(file => fileHelper.isSupportedFileExtension(file.extension))
      } else {
        const fileObject = this.createFileObject(file.path, selectedStream, deploymentInfo)
        if (fileObject) {
          fileObjects.push(fileObject)
        }
      }
    }
    const allFileObjects = fileObjects.concat(fileObjectsInFolder)
    const t1 = performance.now()
    console.log('[Measure] forming file objects ' + (t1 - t0) + ' ms')

    // Remove duplicates that are already in prepare tab
    // const existingPreparedFilePaths = File.query().where((file) => file.streamId === selectedStream.id).get().reduce((result, value) => {
    //   result[value.path] = value.state
    //   return result
    // }, {})
    const existingPreparedFilePaths = await this.getExistingPreparedFilePaths(selectedStream.id)
    const allFileObjectsFiltered = allFileObjects.filter(file => existingPreparedFilePaths[file.path] === undefined || !fileState.isInPreparedGroup(existingPreparedFilePaths[file.path]))
    // Set error message for duplicates that are either uploading or completed
    allFileObjectsFiltered.forEach(file => {
      const hasUploadedBefore = existingPreparedFilePaths[file.path] !== undefined && !fileState.isInPreparedGroup(existingPreparedFilePaths[file.path])
      if (hasUploadedBefore) {
        file.state = ERROR_LOCAL
        file.stateMessage = 'Duplicate (uploading or complete)'
      }
    })
    const t2 = performance.now()
    console.log('[Measure] perform duplicate checks ' + (t2 - t1) + ' ms')

    // Insert converted files into db
    await this.insertNewFiles(allFileObjectsFiltered, selectedStream)
    // electron.ipcRenderer.send('getFileDurationRequest', allFileObjectsFiltered)
    electron.ipcRenderer.send('client.message', {
      client: 'api',
      topic: 'services.file.new'
    })
  }

  async handleDroppedFolder (folderPath, selectedStream, deploymentInfo = null) {
    if (!folderPath) return
    console.log('handleDroppedFolder', folderPath, selectedStream)
    let fileObjectsInFolder = []
    fileObjectsInFolder = fileObjectsInFolder.concat(
      this.getFileObjectsFromFolder(folderPath, selectedStream, null, deploymentInfo)
    ).filter(file => fileHelper.isSupportedFileExtension(file.extension))
    // insert converted files into db

    // Remove duplicates that are already in prepare tab
    // const existingPreparedFilePaths = File.query().where((file) => file.streamId === selectedStream.id).get().reduce((result, value) => {
    //   result[value.path] = value.state
    //   return result
    // }, {})
    const existingPreparedFilePaths = await this.getExistingPreparedFilePaths(selectedStream.id)
    const allFileObjectsFiltered = fileObjectsInFolder.filter(file => existingPreparedFilePaths[file.path] === undefined || !fileState.isInPreparedGroup(existingPreparedFilePaths[file.path]))
    // Set error message for duplicates that are either uploading or completed
    allFileObjectsFiltered.forEach(file => {
      const hasUploadedBefore = existingPreparedFilePaths[file.path] !== undefined && !fileState.isInPreparedGroup(existingPreparedFilePaths[file.path])
      if (hasUploadedBefore) {
        file.state = ERROR_LOCAL
        file.stateMessage = 'Duplicate (uploading or complete)'
      }
    })

    await this.insertNewFiles(allFileObjectsFiltered, selectedStream)
    // electron.ipcRenderer.send('getFileDurationRequest', fileObjectsInFolder)
    // electron.ipcRenderer.send('services.file.added')
    electron.ipcRenderer.send('client.message', {
      client: 'api',
      topic: 'services.file.new'
    })
  }

  getExistingPreparedFilePaths (streamId) {
    return ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { streamId } })
      .then((files) => {
        return files.reduce((result, value) => {
          result[value.path] = value.state
          return result
        }, {})
      })
  }

  getFileObjectsFromFolder (folderPath, selectedStream, existingFileObjects = null, deploymentInfo = null) {
    // see all stuff in the directory
    const stuffInDirectory = fileHelper
      .getFilesFromDirectoryPath(folderPath)
      .map((name) => {
        return { name: name, path: folderPath + '/' + name }
      })
    // get the files in the directory
    const files = stuffInDirectory.filter(
      (file) => !fileHelper.isFolder(file.path)
    )
    // write file into file object array
    let fileObjects = existingFileObjects || []
    files.forEach(file => {
      const fileObject = this.createFileObject(file.path, selectedStream, deploymentInfo)
      if (fileObject) {
        fileObjects.push(fileObject)
      }
    })
    return fileObjects
  }
  async updateFilesDuration (files) {
    for (const file of files) {
      try {
        const durationInSecond = await fileHelper.getFileDuration(file.path)
        await ipcRendererSend('db.files.update', `db.files.update.${Date.now()}`, {
          id: file.id,
          params: { durationInSecond }
        })
      } catch (error) {
        console.error('Failed updating file duration', error)
        await ipcRendererSend('db.files.update', `db.files.update.${Date.now()}`, {
          id: file.id,
          params: { durationInSecond: -2, state: ERROR_SERVER, stateMessage: error.message || 'No duration found' }
        })
      }
    }
  }

  async putFilesIntoUploadingQueue (files) {
    console.log('putFilesIntoUploadingQueue')
    // if there is an active session id then reuse that, otherwise generate a new one
    const sessionId = store.state.AppSetting.currentUploadingSessionId || '_' + Math.random().toString(36).substr(2, 9)
    store.dispatch('setCurrentUploadingSessionId', sessionId)
    for (const file of files) {
      await ipcRendererSend('db.files.update', `db.files.update.${file.id}.${Date.now()}`, {
        id: file.id,
        params: { state: WAITING, stateMessage: null, sessionId: sessionId }
      })
    }
    // always enable uploading process
    await store.dispatch('enableUploadingProcess', true)
  }

  /**
     * Update preparing file format
     * @param {*} format string of format
     * @param {*} fileObjectList list of files
     * @param {*} stream file's stream
     */
  async updateFilesFormat (stream, format = FORMAT_AUTO_DETECT) {
    const t0 = performance.now()
    const fileObjectList = (await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, {
      where: { state: fileState.preparedGroup }
    })).filter(file => fileState.canChangeTimestampFormat(file.state, file.stateMessage))
    const updatedFiles = fileObjectList.map(file => {
      let timestamp
      if (file.extension === 'wav' && format === FileFormat.fileFormat.FILE_HEADER) {
        console.log('create file object with file info yes!')
        const info = new FileInfo(file.path)
        const momentDate = info.recordedDate
        if (momentDate) {
          timestamp = momentDate.format()
        }
        console.log('create file object fileinfo', info)
      }
      if (!timestamp) {
        timestamp = dateHelper.getIsoDateWithFormat(format, file.name)
      }
      const { state, message } = this.getState(timestamp, file.extension)
      const newFile = { ...file }
      // update fields
      newFile.state = state
      newFile.stateMessage = message
      newFile.timestamp = timestamp
      return newFile
    })
    const t1 = performance.now()
    console.log('[Measure] finish forming objects ' + (t1 - t0) + ' ms')
    // let listen = (event, arg) => {
    //   electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.updateFileTimestampResponse, listen)
    //   const t2 = performance.now()
    //   console.log('[Measure] update timestamp format ' + (t2 - t1) + ' ms')
    // }
    // const data = {streamId: stream.id, files: updatedFiles, format: format}
    for (let file of updatedFiles) {
      await ipcRendererSend('db.files.update', `db.files.update.${file.id}.${Date.now()}`, {
        id: file.id,
        params: {
          state: file.state,
          stateMessage: file.stateMessage,
          timestamp: file.timestamp
        }
      })
    }
    const t2 = performance.now()
    console.log('[Measure] update timestamp format ' + (t2 - t1) + ' ms')
    // electron.ipcRenderer.send(DatabaseEventName.eventsName.updateFileTimestampRequest, data)
    // electron.ipcRenderer.on(DatabaseEventName.eventsName.updateFileTimestampResponse, listen)

    // await Stream.update({
    //   where: stream.id,
    //   data: { files: updatedFiles, timestampFormat: format },
    //   update: ['timestampFormat', 'files']
    // })
    await ipcRendererSend('db.streams.update', `db.streams.update.${Date.now()}`, {
      id: stream.id,
      params: { timestampFormat: format }
    })

    console.log(`Updated ${updatedFiles.length} file(s) to stream '${stream.id}'`)
    console.log(`Updated timestampFormat '${format}' to stream '${stream.id}'`)
  }

  /**
     * @param {*} stream file's stream
     * @param {*} file target file to rename
     * @param {*} filename new file name
     */
  async renameFile (file, filename) {
    const streamId = file.streamId
    // const stream = Stream.find(streamId)
    const stream = await ipcRendererSend('db.streams.get', `db.streams.get.${Date.now()}`, streamId)

    if (!stream) {
      throw new Error(`Stream not found`)
    }

    /**
         * File list from stream
        */
    const files = [...(stream.files || [])]

    /**
         * Check already exists file name
        */
    const checkFileAlreadyExists = filePath => {
      // check new file path in stream & file state on preparing
      const fileIdx = files.findIndex(f => (f.path === filePath && ['local_error', 'preparing'].includes(f.state)))
      if (fileIdx > -1 || fs.existsSync(filePath)) {
        throw new Error(`A file with the same name already exists. specify another name.`)
      }
    }

    /**
         * @ function rename file name
         * @ convert callback to promise
        */
    const renameFileOnDisk = () => {
      const path = file.path
      const oldFilename = file.name
      const filenameIdx = path.lastIndexOf(oldFilename)

      let newPath = path
      if (filenameIdx > -1) {
        // concat old path with new file name
        newPath = path.substring(0, filenameIdx) + filename
      }

      if (newPath !== path) {
        // if file already exists then throw error
        checkFileAlreadyExists(newPath)
        return fileHelper.rename(path, newPath, 3)
      } else {
        console.log(`File doesn't need to rename, Because old file name equal to new file name`)
        return Promise.resolve('')
      }
    }

    console.log(`Renaming file name...`)
    // update file name
    const newPath = await renameFileOnDisk()
    if (newPath === '') {
      return Promise.resolve()
    }

    console.log(`Rename file on disk success`)

    console.log(`Checking file name state`)
    // checking file status with new file name

    const format = stream.timestampFormat
    const isoDate = dateHelper.getIsoDateWithFormat(format, filename)
    const stateObj = this.getState(isoDate, file.extension, false)

    // ----- update file on database -----
    const updateFields = {
      state: stateObj.state,
      stateMessage: stateObj.message,
      timestamp: isoDate,
      name: filename,
      path: newPath
    }
    // await File.update({
    //   where: file.id,
    //   data: updateFields,
    //   update: Object.keys(updateFields)
    // })
    await ipcRendererSend('db.files.update', `db.files.update.${Date.now()}`, {
      id: file.id,
      params: updateFields
    })

    console.log(`Update file success`)
    return Promise.resolve(updateFields)
    // const newFile = { ...file, ...updateFields }
    // const fileIdx = files.findIndex(f => f.id === file.id)
    // if (fileIdx > -1) {
    //   files[fileIdx] = newFile
    //   await Stream.update({
    //     where: stream.id,
    //     data: { files },
    //     update: ['files']
    //   })

    //   console.log(`Update stream success`)
    // }
  }

  // 2. Upload files
  // - Upload
  // - check status

  /* -- API Wrapper -- */
  async uploadFile (file, idToken) {
    console.log('\nupload file ', file.id)
    if (!fileHelper.isExist(file.path)) {
      return Promise.reject(new Error('File does not exist'))
    }
    const timestamp = fileHelper.getUtcTimestamp(file)
    return api.uploadFile(this.isProductionEnv(), file.id, file.name, file.path, file.extension, file.streamId, timestamp, idToken, (progress) => {
      // FIX progress scale when we will start work with google cloud
    }).then((uploadId) => {
      console.log(`\n ===> file uploaded to the temp folder S3 ${file.name} ${uploadId}`)
      // return File.update({ where: file.id, data: { uploaded: true, uploadedTime: Date.now() } })
      return ipcRendererSend('db.files.update', `db.files.update.${Date.now()}`, {
        id: file.id,
        params: { uploaded: true, uploadedTime: Date.now(), state: PROCESSING, stateMessage: '' }
      })
    }).catch(async (error) => {
      console.log('===> ERROR UPLOAD FILE', file.name, error.message, error.name)
      if (error.message === 'Duplicate.') { // if duplicate file (same site, same file data, same filename), then show as completed
        return this.markFileAsCompleted(file)
      }

      // should not retry
      const shouldNotAutoRetry = ['Invalid.', 'Request body larger than maxBodyLength limit'].includes(error.message) || ['ForbiddenError'].includes(error.name)
      if (shouldNotAutoRetry) {
        if (error.message === 'Invalid.') { // (same site, same file data, different filename)
          return this.markFileAsFailed(file, 'Duplicate file. Matching sha1 signature already ingested.')
        }
        if (error.message === 'Request body larger than maxBodyLength limit') {
          return this.markFileAsFailed(file, 'File size exceeded. Maximum file size is 200 MB')
        }
        return this.markFileAsFailed(file, error.message)
      }

      // auto retry to upload
      if (file.retries < 3) {
        return this.markFileAsRetryToUpload(file)
      }
      // error after auto retry
      if (['write EPIPE', 'read ECONNRESET', 'Network Error', 'ETIMEDOUT', '400'].includes(error.message)) {
        return this.markFileAsFailed(file, 'Network Error')
      }
      // default
      return this.markFileAsFailed(file, 'Server failed with processing your file. Please try again later.')
    })
  }

  checkStatus (file, idToken, isSuspended) {
    // If the app suspends/loses internet connection the uploading file changes the status to waiting
    if (!file.uploadId) { return this.markFileAsSuspend(file) }
    return api
      .checkStatus(this.isProductionEnv(), file.uploadId, idToken)
      .then(async (data) => {
        const status = data.status
        const failureMessage = data.failureMessage
        console.log(`===> ${file.name} ${file.uploadId} - Ingest status = ${status}`)
        // const currentStateOfFile = File.find(file.id).state
        const currentStateOfFile = file.state
        switch (status) {
          case 0:
            if (isSuspended) {
              // If the app suspends/loses internet connection the uploading file changes the status to waiting
              return this.markFileAsSuspend(file)
            }
            return
          case 10:
            if (currentStateOfFile === PROCESSING) return
            return ipcRendererSend('db.files.update', `db.files.update.${Date.now()}`, {
              id: file.id,
              params: { state: PROCESSING, stateMessage: null, progress: 100 }
            })
          case 20:
            if (currentStateOfFile === COMPLETED) return
            const uploadTime = Date.now() - file.uploadedTime
            const analyticsEventObj = { 'ec': env.analytics.category.time, 'ea': env.analytics.action.ingest, 'el': `${file.name}/${file.uploadId}`, 'ev': uploadTime }
            await analytics.send('event', analyticsEventObj)
            return this.markFileAsCompleted(file)
          case 30:
          case 32:
            if (failureMessage.includes('is zero')) {
              return this.markFileAsFailed(file, 'Corrupted file')
            } else if (file.retries < 3) {
              return this.markFileAsRetryToUpload(file)
            }
            return this.markFileAsFailed(file, failureMessage)
          default:
            return this.markFileAsFailed(file, failureMessage)
        }
      })
      .catch(async (error) => {
        console.log('check status error', error)
        if (file.retries < 3) {
          return this.markFileAsRetryToUpload(file)
        } else {
          return this.markFileAsFailed(file, 'Server failed with processing your file. Please try again later.')
        }
      })
  }

  isProductionEnv () {
    return settings.get('settings.production_env')
  }

  /* -- Database wrapper -- */
  async insertNewFiles (files, selectedStream) {
    const t0 = performance.now()
    await this.insertFiles(files)
    const t1 = performance.now()
    console.log('[Measure] insertNewFiles ' + (t1 - t0) + ' ms')
  }

  async insertFiles (files) {
    await ipcRendererSend('db.files.bulkCreate', `db.files.bulkCreate.${Date.now()}`, files)
  }

  async markFileAsRetryToUpload (file) {
    return ipcRendererSend('db.files.update', `db.files.update.${Date.now()}`, {
      id: file.id,
      params: { state: WAITING, uploadId: null, stateMessage: null, progress: 0, retries: file.retries + 1 }
    })
  }

  async markFileAsSuspend (file) {
    return ipcRendererSend('db.files.update', `db.files.update.${Date.now()}`, {
      id: file.id,
      params: { state: WAITING, uploadId: null, stateMessage: null, progress: 0, retries: 0 }
    })
  }

  async markFileAsCompleted (file) {
    return ipcRendererSend('db.files.update', `db.files.update.${Date.now()}`, {
      id: file.id,
      params: { state: COMPLETED, stateMessage: '' }
    })
  }

  async markFileAsFailed (file, errorMessage) {
    return ipcRendererSend('db.files.update', `db.files.update.${Date.now()}`, {
      id: file.id,
      params: { state: ERROR_SERVER, stateMessage: errorMessage }
    })
  }

  /* -- Import -- */

  getDeviceInfoFromFolder (path) {
    const stuffInDirectory = fileHelper
      .getFilesFromDirectoryPath(path)
      .map((name) => {
        return { name: name, path: path + '/' + name }
      })
    // read file header info
    const firstWavFile = stuffInDirectory.find(file => {
      return fileHelper.getExtension(file.path) === 'wav' // read only wav file header info
    })
    return this.getDeviceInfo(firstWavFile)
  }

  getDeviceInfo (file) {
    if (!file) return undefined
    const fileInfo = new FileInfo(file.path)
    const deviceId = fileInfo.deviceId
    const deploymentId = fileInfo.deployment
    return {deviceId, deploymentId}
  }

  /* -- Helper -- */

  createFileObject (filePath, stream, deploymentInfo = null) {
    const fileName = fileHelper.getFileNameFromFilePath(filePath)
    const fileExt = fileHelper.getExtension(fileName)

    // TODO: request to read file info in bg thread if needed

    // read deployment info
    let deviceId, deploymentId
    if (deploymentInfo) {
      deviceId = deploymentInfo.deviceId
      deploymentId = deploymentInfo.deploymentId
    }

    const size = fileHelper.getFileSize(filePath)
    const timestamp = dateHelper.getIsoDateWithFormat(stream.timestampFormat, fileName)
    const { state, message } = this.getState(timestamp, fileExt)

    return {
      id: this.getFileId(filePath),
      name: fileName,
      hash: '',
      sha1: '',
      path: filePath,
      extension: fileExt,
      sizeInByte: size,
      durationInSecond: -1,
      timestamp: timestamp,
      timezone: stream.timezone, // TODO: change to selected timezone (configure by user)
      streamId: stream.id,
      state: state,
      stateMessage: message,
      deviceId,
      deploymentId
    }
  }

  getState (timestamp, fileExt) {
    const momentDate = dateHelper.getMomentDateFromISODate(timestamp)
    if (!fileHelper.isSupportedFileExtension(fileExt)) {
      return { state: ERROR_LOCAL, message: 'File extension is not supported' }
    } else if (!momentDate.isValid()) {
      return { state: ERROR_LOCAL, message: 'Filename does not match with a filename format' }
    } else {
      return { state: PREPARING, message: '' }
    }
  }

  getFileId (filePath) {
    return cryptoJS.MD5(filePath).toString() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

export default new FileProvider()
