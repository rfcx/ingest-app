import { BrowserWindow } from 'electron'
import authService from './auth-service'
import index from '../index'
import settings from 'electron-settings'

const filter = {
  urls: ['file:///callback*']
}
let win = null

function createAuthWindow () {
  console.log('createAuthWindow')
  let isDarkMode = settings.get('settings.darkMode')
  win = new BrowserWindow({
    width: 1000,
    height: 650,
    webPreferences: {
      nodeIntegration: false
    }
  })
  const {
    session: { webRequest }
  } = win.webContents
  win.loadURL(authService.getAuthenticationURL(), { userAgent: 'Chrome' })
  webRequest.onBeforeRequest(filter, async ({ url }) => {
    console.log('authWindow onBeforeRequest')
    await authService.loadTokens(url)
    await index.hasAccessToApp()
    index.createWindow(false)
    await destroyAuthWin()
  })
  // win.webContents.once('dom-ready', () => win.webContents.openDevTools())
  win.webContents.on('did-finish-load', () => {
    let code = `if (document.getElementById('btn-login-passwordless'))
                { document.getElementById('btn-login-passwordless').style.display = 'none' }
                let body = document.getElementsByTagName('body')[0]
                if (body && ${isDarkMode})
                { body.style.backgroundColor = '#131525';  body.style.color = '#fff' }`
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
