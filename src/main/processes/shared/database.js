import store from '../../../renderer/store'
import File from '../../../renderer/store/models/File'
import FileState from '../.././../../utils/fileState'
import FileHelper from '../.././../../utils/fileHelper'
import Stream from '../../../renderer/store/models/Stream'

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
  },
  // queue
  putFilesIntoUploadingQueue: async (streamId, sessionId) => {
    console.log(`putFilesIntoUploadingQueue ${streamId} ${sessionId}`)
    const files = File.query().where((file) => file.streamId === streamId && FileState.isPreparing(file.state)).get().reduce((result, file) => {
      result[file.id] = { ...file, state: 'waiting', stateMessage: '', sessionId: sessionId }
      return result
    }, {})
    const numberOfFiles = Object.keys(files).length
    console.log('files to update', numberOfFiles)
    store.commit('entities/insertRecords', {
      entity: 'files',
      records: files
    })
    await Stream.dispatch('filesAddedToUploadSession', { streamId, amount: numberOfFiles })
  },
  // delete
  deleteStream: async (streamId) => {
    await File.delete(file => file.streamId === streamId)
    await Stream.delete(streamId)
  },
  deletePreparingFiles: async (streamId) => {
    await File.delete(file => FileState.isInPreparedGroup(file.state) && file.streamId === streamId)
    await Stream.update({
      where: streamId,
      data: { preparingCount: 0 }
    })
  },
  deleteOutdatedFiles: async () => {
    await File.delete(file => FileState.isCompleted(file.state) && FileHelper.isOutdatedFile(file))
    console.log('deleting outdated files complete')
  }
}
