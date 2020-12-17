// TODO: implement new auth process here
import { BrowserWindow } from 'electron'

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

    authWindow.on('closed', () => {
      if (authWindow) {
        authWindow.destroy()
        console.log('auth window closed')
      }
    })

    return authWindow
  }
}
