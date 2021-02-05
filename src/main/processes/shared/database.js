import store from '../../../renderer/store'
import File from '../../../renderer/store/models/File'
import FileState from '../.././../../utils/fileState'

export default {
  // prepare
  updateFilesTimezone: (event, streamId, timezone) => {
    console.log(`updateFilesTimezone ${streamId} ${timezone}`)
    const preparingFiles = File.query().where(file => file.streamId === streamId && file.isInPreparedGroup).get()
    const updatedFiles = preparingFiles.reduce((result, file) => {
      result[file.id] = { ...file, timezone: timezone }
      return result
    }, {})
    console.log('files to update', updatedFiles.length)
    store.commit('entities/insertRecords', {
      entity: 'files',
      records: updatedFiles
    })
    event.sender.send('updateFilesTimezoneComplete')
  },
  updateTimestampFormat: (event, format, streamId, files) => {
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
    event.sender.send('updateTimestampFormatComplete')
  },
  // queue
  putFilesIntoUploadingQueue: (event, streamId, sessionId) => {
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
    event.sender.send('putFilesIntoUploadingQueueDone')
  },
  // delete
  deleteFiles: async (event, ids) => { // TODO: change to be 'deleteAllFiles' with stream id params
    await File.delete(file => ids.includes(file.id))
    event.sender.send('filesDeleted')
  },
  deletePreparingFiles: async (event, streamId) => {
    await File.delete(file => FileState.isInPreparedGroup(file.state) && file.streamId === streamId)
    event.sender.send('preparedFilesDeleted')
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
