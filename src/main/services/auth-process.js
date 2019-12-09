import { BrowserWindow } from 'electron'
import authService from './auth-service'
import index from '../index'

const filter = {
  urls: ['file:///callback*']
}
let win = null

function createAuthWindow () {
  console.log('createAuthWindow')
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
    console.log('authWindow onBeforeRequest')
    await authService.loadTokens(url)
    await index.hasAccessToApp()
    if (process.platform === 'win32' || process.platform === 'win64') {
      console.log('create main window from auth0 process for Windows')
      index.createWindow(false)
      await destroyAuthWin()
      return
    }
    index.createWindow(false)
    await destroyAuthWin()
    // console.log('create main window from auth0 process')
    // index.createWindow(false)
  })
  win.webContents.once('dom-ready', () => win.webContents.openDevTools())
  win.webContents.on('did-finish-load', () => {
    let code = `if (document.getElementById('btn-login-passwordless'))
                { document.getElementById('btn-login-passwordless').style.display = 'none' }`
    win.webContents.executeJavaScript(code)
  })
  win.on('closed', () => {
    win = null
    console.log('auth window closed')
  })
}

function destroyAuthWin () {
  return new Promise((resolve, reject) => {
    if (!win) return resolve()
    win.close()
    resolve()
  })
}

export default createAuthWindow
