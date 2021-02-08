import store from '../../../renderer/store'
import File from '../../../renderer/store/models/File'
import FileState from '../.././../../utils/fileState'
import FileHelper from '../.././../../utils/fileHelper'

export default {
  // prepare
  updateFilesTimezone: async (streamId, timezone) => {
    console.log(`updateFilesTimezone ${streamId} ${timezone}`)
    return new Promise((resolve, reject) => {
      const preparingFiles = File.query().where(file => file.streamId === streamId && file.isInPreparedGroup).get()
      const updatedFiles = preparingFiles.reduce((result, file) => {
        result[file.id] = { ...file, timezone: timezone }
        return result
      }, {})
      console.log('files to update timezone', preparingFiles.length)
      store.commit('entities/insertRecords', {
        entity: 'files',
        records: updatedFiles
      })
      resolve()
    })
  },
  updateFilesDuration: async (files) => {
    const updatedFiles = files.reduce((result, file) => {
      const existingFile = File.find(file.id)
      if (existingFile) {
        result[file.id] = { ...existingFile, ...file }
      }
      return result
    }, {})
    console.log('files to updateFilesDuration', Object.keys(updatedFiles).length)
    store.commit('entities/insertRecords', {
      entity: 'files',
      records: updatedFiles
    })
    return Promise.resolve()
  },
  updateTimestampFormat: (format, streamId, files) => {
    console.log(`updateTimestampFormat ${streamId} ${files.length} ${format}`)
    const updatedFiles = files.reduce((result, file) => {
      result[file.id] = { ...file }
      return result
    }, {})
    console.log('files to update', updatedFiles.length)
    store.commit('entities/insertRecords', {
      entity: 'files',
      records: updatedFiles
    })
    return Promise.resolve()
  },
  // queue
  putFilesIntoUploadingQueue: async (streamId, sessionId) => {
    console.log(`putFilesIntoUploadingQueue ${streamId} ${sessionId}`)
    const files = File.query().where((file) => file.streamId === streamId && FileState.isPreparing(file.state)).get().reduce((result, file) => {
      result[file.id] = { ...file, state: 'waiting', stateMessage: '', sessionId: sessionId }
      return result
    }, {})
    console.log('files to update', files.length)
    store.commit('entities/insertRecords', {
      entity: 'files',
      records: files
    })
    return Promise.resolve()
  },
  // delete
  deleteFiles: async (ids) => { // TODO: change to be 'deleteAllFiles' with stream id params
    await File.delete(file => ids.includes(file.id))
    return Promise.resolve()
  },
  deletePreparingFiles: async (streamId) => {
    await File.delete(file => FileState.isInPreparedGroup(file.state) && file.streamId === streamId)
    return Promise.resolve()
  },
  deleteOutdatedFiles: async () => {
    await File.delete(file => FileState.isCompleted(file.state) && FileHelper.isOutdatedFile(file))
    console.log('deleting outdated files complete')
    return Promise.resolve()
  },
  // other
  toggleUploadingProcess: (event, files, isToggledUploadingProcess) => {
    console.log(`toggleUploadingSession ${files.length} ${isToggledUploadingProcess}`)
    const updatedFiles = files.reduce((result, file) => {
      result[file.id] = { ...file, paused: !isToggledUploadingProcess }
      return result
    }, {})
    store.commit('entities/insertRecords', {
      entity: 'files',
      records: updatedFiles
    })
    event.sender.send('toggleUploadingSessionComplete')
  }
}
