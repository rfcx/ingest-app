import { BrowserWindow, ipcMain } from 'electron'
import database from '../../shared/database'

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
      database.deleteFiles(event, ids)
    })

    ipcMain.on('deletePreparedFiles', async function (event, streamId) {
      database.deletePreparingFiles(event, streamId)
    })

    ipcMain.on('putFilesIntoUploadingQueue', async function (event, data) {
      database.putFilesIntoUploadingQueue(event, data.streamId, data.sessionId)
    })

    ipcMain.on('updateTimestampFormat', async function (event, data) {
      database.updateTimestampFormat(event, data.format, data.streamId, data.files)
    })

    return mainWindow
  }
}
