import { BrowserWindow } from 'electron'
import authService from './auth-service'
import createWindow from '../index'

const filter = {
  urls: ['file:///callback*']
}
let win = null

function createAuthWindow () {
  win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: false
    }
  })
  const {
    session: { webRequest }
  } = win.webContents
  win.loadURL(authService.getAuthenticationURL())
  webRequest.onBeforeRequest(filter, async ({ url }) => {
    await authService.loadTokens(url)
    destroyAuthWin()
  })
  win.on('closed', () => {
    win = null
    console.log('auth window closed')
    createWindow(false)
  })
}

function destroyAuthWin () {
  if (!win) return
  win.close()
}

export default createAuthWindow
