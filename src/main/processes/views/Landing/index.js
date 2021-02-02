import { BrowserWindow, ipcMain } from 'electron'
import File from '../../../../renderer/store/models/File'
import store from '../../../../renderer/store'
import FileState from '../../../../../utils/fileState'

export default {
  createWindow (isShow, onCloseHandler, onClosedHandler) {
    console.log('preferences process: createWindow')
    const mainWindowURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`
    const mainWindow = new BrowserWindow({
      show: isShow,
      useContentSize: true,
      width: 1000,
      height: 563,
      minWidth: 400,
      backgroundColor: '#131525',
      webPreferences: { nodeIntegration: true }
    })

    mainWindow.loadURL(mainWindowURL)

    mainWindow.on('close', (e) => {
      onCloseHandler(e)
    })

    mainWindow.on('closed', (e) => {
      onClosedHandler(e)
    })

    ipcMain.on('deleteFiles', async function (event, ids) {
      await File.delete(file => ids.includes(file.id))
      event.sender.send('filesDeleted')
    })

    ipcMain.on('deletePreparedFiles', async function (event, streamId) {
      await File.delete(file => FileState.isInPreparedGroup(file.state) && file.streamId === streamId)
      event.sender.send('preparedFilesDeleted')
    })

    ipcMain.on('putFilesIntoUploadingQueue', async function (event, data) {
      console.log(`putFilesIntoUploadingQueue ${data.streamId} ${data.sessionId}`)
      const files = File.query().where((file) => file.streamId === data.streamId && FileState.isPreparing(file.state)).get().reduce((result, file) => {
        result[file.id] = { ...file, state: 'waiting', stateMessage: '', sessionId: data.sessionId }
        return result
      }, {})
      console.log('files to update', files.length)
      store.commit('entities/insertRecords', {
        entity: 'files',
        records: files
      })
      event.sender.send('putFilesIntoUploadingQueueDone')
    })

    ipcMain.on('updateTimestampFormat', async function (event, data) {
      console.log(`updateTimestampFormat ${data.streamId} ${data.files} ${data.format}`)
      const updatedFiles = data.files.reduce((result, file) => {
        result[file.id] = { ...file }
        return result
      }, {})
      console.log('files to update', updatedFiles.length)
      store.commit('entities/insertRecords', {
        entity: 'files',
        records: updatedFiles
      })
      event.sender.send('updateTimestampFormatComplete')
    })

    return mainWindow
  }
}
