import { BrowserWindow, ipcMain } from 'electron'
import File from '../../../../renderer/store/models/File'
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
      console.log('deleteFiles', ids)
      await Promise.all(ids.map(id => File.delete(id)))
      event.sender.send('filesDeleted')
    })

    return mainWindow
  }
}
