import electron from 'electron'
import settings from 'electron-settings'
import api from '../../../utils/api'
import File from '../store/models/File'
import Stream from '../store/models/Stream'
import fileHelper from '../../../utils/fileHelper'
import dateHelper from '../../../utils/dateHelper'
import FileFormat from '../../../utils/FileFormat'
import DatabaseEventName from '../../../utils/DatabaseEventName'
import cryptoJS from 'crypto-js'
import store from '../store'
import FileInfo from './FileInfo'
import fs from 'fs'
import Analytics from 'electron-ga'
import env from '../../../env.json'
import fileState from '../../../utils/fileState'

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
    const existingPreparedFilePaths = File.query().where((file) => file.streamId === selectedStream.id).get().reduce((result, value) => {
      result[value.path] = value.state
      return result
    }, {})
    const allFileObjectsFiltered = allFileObjects.filter(file => existingPreparedFilePaths[file.path] === undefined || !fileState.isInPreparedGroup(existingPreparedFilePaths[file.path]))
    // Set error message for duplicates that are either uploading or completed
    allFileObjectsFiltered.forEach(file => {
      const hasUploadedBefore = existingPreparedFilePaths[file.path] !== undefined && !fileState.isInPreparedGroup(existingPreparedFilePaths[file.path])
      if (hasUploadedBefore) {
        file.state = 'local_error'
        file.stateMessage = 'Duplicate (uploading or complete)'
      }
    })
    const t2 = performance.now()
    console.log('[Measure] perform duplicate checks ' + (t2 - t1) + ' ms')

    // Insert converted files into db
    await this.insertNewFiles(allFileObjectsFiltered, selectedStream)
    electron.ipcRenderer.send('getFileDurationRequest', allFileObjectsFiltered)
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
    const existingPreparedFilePaths = File.query().where((file) => file.streamId === selectedStream.id).get().reduce((result, value) => {
      result[value.path] = value.state
      return result
    }, {})
    const allFileObjectsFiltered = fileObjectsInFolder.filter(file => existingPreparedFilePaths[file.path] === undefined || !fileState.isInPreparedGroup(existingPreparedFilePaths[file.path]))
    // Set error message for duplicates that are either uploading or completed
    allFileObjectsFiltered.forEach(file => {
      const hasUploadedBefore = existingPreparedFilePaths[file.path] !== undefined && !fileState.isInPreparedGroup(existingPreparedFilePaths[file.path])
      if (hasUploadedBefore) {
        file.state = 'local_error'
        file.stateMessage = 'Duplicate (uploading or complete)'
      }
    })

    await this.insertNewFiles(allFileObjectsFiltered, selectedStream)
    electron.ipcRenderer.send('getFileDurationRequest', fileObjectsInFolder)
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
    let listen = (event, arg) => {
      electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.updateFileDurationResponse, listen)
      console.log('update files duration completed')
    }
    const fileDurationUpdates = []
    for (const file of files) {
      try {
        const durationInSecond = await fileHelper.getFileDuration(file.path)
        fileDurationUpdates.push({ id: file.id, durationInSecond: durationInSecond })
      } catch (error) { }
    }
    electron.ipcRenderer.send(DatabaseEventName.eventsName.updateFileDurationRequest, fileDurationUpdates)
    electron.ipcRenderer.on(DatabaseEventName.eventsName.updateFileDurationResponse, listen)
  }

  putFilesIntoUploadingQueue (files) {
    console.log('putFilesIntoUploadingQueue')
    // if there is an active session id then reuse that, otherwise generate a new one
    const sessionId = store.state.AppSetting.currentUploadingSessionId || '_' + Math.random().toString(36).substr(2, 9)
    store.dispatch('setCurrentUploadingSessionId', sessionId)
    files.forEach(file => {
      File.update({ where: file.id,
        data: { state: 'waiting', stateMessage: '', sessionId: sessionId }
      })
    })
  }

  /**
     * Update preparing file format
     * @param {*} format string of format
     * @param {*} fileObjectList list of files
     * @param {*} stream file's stream
     */
  async updateFilesFormat (stream, fileObjectList, format = FORMAT_AUTO_DETECT) {
    const t0 = performance.now()
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
    let listen = (event, arg) => {
      electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.updateFileTimestampResponse, listen)
      const t2 = performance.now()
      console.log('[Measure] update timestamp format ' + (t2 - t1) + ' ms')
    }
    const data = {streamId: stream.id, files: updatedFiles, format: format}
    electron.ipcRenderer.send(DatabaseEventName.eventsName.updateFileTimestampRequest, data)
    electron.ipcRenderer.on(DatabaseEventName.eventsName.updateFileTimestampResponse, listen)

    await Stream.update({
      where: stream.id,
      data: { files: updatedFiles, timestampFormat: format },
      update: ['timestampFormat', 'files']
    })

    console.log(
      `Updated ${updatedFiles.length} file(s) to stream '${stream.id}'`
    )
    console.log(`Updated timestampFormat '${format}' to stream '${stream.id}'`)
  }

  /**
     * @param {*} stream file's stream
     * @param {*} file target file to rename
     * @param {*} filename new file name
     */
  async renameFile (file, filename) {
    const streamId = file.streamId
    const stream = Stream.find(streamId)

    if (!stream) {
      throw new Error(`Stream not fount`)
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
    await File.update({
      where: file.id,
      data: updateFields,
      update: Object.keys(updateFields)
    })

    console.log(`Update file success`)

    const newFile = { ...file, ...updateFields }
    const fileIdx = files.findIndex(f => f.id === file.id)
    if (fileIdx > -1) {
      files[fileIdx] = newFile
      await Stream.update({
        where: stream.id,
        data: { files },
        update: ['files']
      })

      console.log(`Update stream success`)
    }
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
    return api.uploadFile(this.isProductionEnv(), file.id, file.name, file.path, file.extension, file.streamId, file.utcTimestamp, idToken, (progress) => {
      // FIX progress scale when we will start work with google cloud
    }).then((uploadId) => {
      console.log(`\n ===> file uploaded to the temp folder S3 ${file.name} ${uploadId}`)
      return File.update({ where: file.id, data: { uploaded: true, uploadedTime: Date.now(), state: 'ingesting', stateMessage: '' } })
    }).catch((error) => {
      console.log('===> ERROR UPLOAD FILE', file.name, error.message)
      if (error.message === 'Request body larger than maxBodyLength limit') {
        File.update({
          where: file.id,
          data: { state: 'server_error', stateMessage: 'File size exceeded. Maximum file size is 200 MB' }
        })
        return this.incrementFilesCount(file.streamId, false)
      } else if (error.message === 'Duplicate.') { // same file data + same name is already ingested
        File.update({
          where: file.id,
          data: { state: 'completed', stateMessage: '' }
        })
        return this.incrementFilesCount(file.streamId, true)
      } else if (error.message === 'Invalid.') { // same file data + different name is already ingested
        File.update({
          where: file.id,
          data: { state: 'server_error', stateMessage: 'Duplicate file. Matching sha1 signature already ingested.' }
        })
        return this.incrementFilesCount(file.streamId, false)
      } else if (file.retries < 3) {
        return File.update({
          where: file.id,
          data: { state: 'waiting', uploadId: '', stateMessage: '', progress: 0, retries: file.retries + 1 }
        })
      } else if (error.message === 'write EPIPE' || error.message === 'read ECONNRESET' || error.message === 'Network Error' || error.message.includes('ETIMEDOUT' || '400')) {
        File.update({
          where: file.id,
          data: { state: 'server_error', stateMessage: 'Network Error' }
        })
        return this.incrementFilesCount(file.streamId, false)
      } else {
        File.update({
          where: file.id,
          data: { state: 'server_error', stateMessage: 'Server failed with processing your file. Please try again later.' }
        })
        return this.incrementFilesCount(file.streamId, false)
      }
    })
  }

  checkStatus (file, idToken, isSuspended) {
    return api
      .checkStatus(this.isProductionEnv(), file.uploadId, idToken)
      .then(async (data) => {
        const status = data.status
        const failureMessage = data.failureMessage
        console.log(`===> ${file.name} ${file.uploadId} - Ingest status = ${status}`)
        const currentStateOfFile = File.find(file.id).state
        switch (status) {
          case 0:
            if (isSuspended) {
              // If the app suspends/loses internet connection the uploading file changes the status to waiting
              return File.update({
                where: file.id,
                data: {
                  state: 'waiting',
                  uploadId: '',
                  stateMessage: '',
                  progress: 0,
                  retries: 0
                }
              })
            }
            return
          case 10:
            if (currentStateOfFile === 'ingesting') return
            return File.update({
              where: file.id,
              data: { state: 'ingesting', stateMessage: '', progress: 100 }
            })
          case 20:
            if (currentStateOfFile === 'completed') return
            const uploadTime = Date.now() - file.uploadedTime
            const analyticsEventObj = { 'ec': env.analytics.category.time, 'ea': env.analytics.action.ingest, 'el': `${file.name}/${file.uploadId}`, 'ev': uploadTime }
            await analytics.send('event', analyticsEventObj)
            File.update({
              where: file.id,
              data: { state: 'completed', stateMessage: '', progress: 100 }
            })
            return this.incrementFilesCount(file.streamId, true)
          case 30:
            if (failureMessage.includes('is zero')) {
              File.update({
                where: file.id,
                data: { state: 'server_error', stateMessage: 'Corrupted file' }
              })
              return this.incrementFilesCount(file.streamId, false)
            } else if (file.retries < 3) {
              File.update({
                where: file.id,
                data: {
                  state: 'waiting',
                  uploadId: '',
                  stateMessage: '',
                  progress: 0,
                  retries: file.retries + 1
                }
              })
            } else {
              File.update({
                where: file.id,
                data: { state: 'server_error', stateMessage: failureMessage }
              })
              return this.incrementFilesCount(file.streamId, false)
            }
            break
          default:
            File.update({
              where: file.id,
              data: { state: 'server_error', stateMessage: failureMessage }
            })
            return this.incrementFilesCount(file.streamId, false)
        }
      })
      .catch((error) => {
        console.log('check status error', error)
        if (file.retries < 3) {
          return File.update({
            where: file.id,
            data: {
              state: 'waiting',
              uploadId: '',
              stateMessage: '',
              progress: 0,
              retries: file.retries + 1
            }
          })
        } else {
          File.update({
            where: file.id,
            data: { state: 'failed', stateMessage: 'Server failed with processing your file. Please try again later.' }
          })
          return this.incrementFilesCount(file.streamId, false)
        }
      })
  }

  async incrementFilesCount (streamId, success) {
    // await Stream.dispatch('filesCompletedUploadSession', { streamId, amount: 1, success })
  }

  isProductionEnv () {
    return settings.get('settings.production_env')
  }

  /* -- Database wrapper -- */
  async insertNewFiles (files, selectedStream) {
    const t0 = performance.now()
    await this.insertFiles(files)
    await this.insertFilesToStream(files, selectedStream)
    const t1 = performance.now()
    console.log('[Measure] insertNewFiles ' + (t1 - t0) + ' ms')
  }

  async insertFiles (files) {
    await File.insert({ data: files })
    console.log('insert files: ', files.length)
  }

  // This function supports only @vuex-orm/core@0.32.2 version.
  async insertFilesToStream (files, stream) {
    await Stream.update({
      where: stream.id,
      data: { preparingCount: files.length, files: files, updatedAt: Date.now() },
      insert: ['files']
    })
    console.log('insert files to stream:', files.length)
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
      timezone: stream.defaultTimezone, // TODO: change to selected timezone (configure by user)
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
      return { state: 'local_error', message: 'File extension is not supported' }
    } else if (!momentDate.isValid()) {
      return { state: 'local_error', message: 'Filename does not match with a filename format' }
    } else {
      return { state: 'preparing', message: '' }
    }
  }

  getFileId (filePath) {
    return cryptoJS.MD5(filePath).toString() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

export default new FileProvider()
