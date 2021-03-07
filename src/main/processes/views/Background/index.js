import { BrowserWindow, powerMonitor, ipcMain } from 'electron'
import database from '../../shared/database'
import DatabaseEventName from '../../../../../utils/DatabaseEventName'
import settings from 'electron-settings'

export default {
  createWindow () {
    console.log('background process: createWindow')
    const backgroundAPIURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080/#/api-service` : `file://${__dirname}/index.html#/api-service`
    const backgroundAPIWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: true }
    })
    backgroundAPIWindow.loadURL(backgroundAPIURL)

    powerMonitor.on('suspend', () => {
      console.log('------------The system is going to suspend----------')
      // Pause uploading process if the app hasn't an internet connection
      backgroundAPIWindow.webContents.send('suspendApp', false)
    })
    powerMonitor.on('resume', () => {
      console.log('------------The system is going to resume-----------')
      // Continue uploading process if the app has an internet connection
      if (settings.get('settings.onLine')) {
        backgroundAPIWindow.webContents.send('suspendApp', true)
      }
    })

    ipcMain.on(DatabaseEventName.eventsName.updateFilesDoNotExistRequest, async function (event, files) {
      await database.updateFilesDoNotExist(files)
      event.sender.send(DatabaseEventName.eventsName.updateFilesDoNotExistResponse)
    })

    return backgroundAPIWindow
  }
}
