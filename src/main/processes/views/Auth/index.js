// TODO: implement new auth process here
import { app, ipcMain, BrowserWindow } from 'electron'
import { menuProcess } from '../../../processes'

export default {
  createWindow () {
    console.log('background process: createWindow')
    const authURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080/#/auth` : `file://${__dirname}/index.html#/auth`
    const authWindow = new BrowserWindow({
      width: 1000,
      height: 563,
      minWidth: 770,
      webPreferences: { nodeIntegration: true }
    })
    authWindow.loadURL(authURL)
    menuProcess.authMenu.createMenu(async () => {
      authWindow.destroy()
      app.exit()
      app.quit()
    })

    authWindow.on('closed', () => {
      if (authWindow) {
        authWindow.destroy()
        console.log('auth window closed')
      }
    })

    return authWindow
  },
  addGetIdTokenListener (handler) {
    ipcMain.on('getIdToken', (event, args) => {
      handler(event, args)
    })
  }
}
