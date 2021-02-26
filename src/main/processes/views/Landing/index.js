import { BrowserWindow, ipcMain } from 'electron'
import database from '../../shared/database'
import DatabaseEventName from '../../../../../utils/DatabaseEventName'

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

    ipcMain.on(DatabaseEventName.eventsName.deleteAllFilesRequest, async function (event, streamId) {
      await database.deleteStream(streamId)
      event.sender.send(DatabaseEventName.eventsName.deleteAllFilesResponse)
    })

    ipcMain.on(DatabaseEventName.eventsName.deletePreparingFilesRequest, async function (event, streamId) {
      await database.deletePreparingFiles(streamId)
      event.sender.send(DatabaseEventName.eventsName.deletePreparingFilesResponse)
    })

    ipcMain.on(DatabaseEventName.eventsName.deleteOutdatedFilesRequest, async function (event) {
      await database.deleteOutdatedFiles()
      event.sender.send(DatabaseEventName.eventsName.deleteOutdatedFilesResponse)
    })

    ipcMain.on(DatabaseEventName.eventsName.putFilesIntoUploadingQueueRequest, async function (event, data) {
      await database.putFilesIntoUploadingQueue(data.streamId, data.sessionId)
      event.sender.send(DatabaseEventName.eventsName.putFilesIntoUploadingQueueResponse)
    })

    ipcMain.on(DatabaseEventName.eventsName.updateFilesTimezoneRequest, async function (event, data) {
      await database.updateFilesTimezone(data.streamId, data.timezone)
      event.sender.send(DatabaseEventName.eventsName.updateFilesTimezoneResponse)
    })

    ipcMain.on(DatabaseEventName.eventsName.updateFileTimestampRequest, async function (event, data) {
      await database.updateTimestampFormat(data.format, data.streamId, data.files)
      event.sender.send(DatabaseEventName.eventsName.updateFileTimestampResponse)
    })

    ipcMain.on(DatabaseEventName.eventsName.updateFileDurationRequest, async function (event, files) {
      await database.updateFilesDuration(files)
      event.sender.send(DatabaseEventName.eventsName.updateFileDurationResponse)
    })

    return mainWindow
  }
}
