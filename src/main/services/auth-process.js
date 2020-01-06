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
    width: 600,
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
                let title = document.getElementsByTagName('h3')[0]
                if (title) { title.textContent= 'Rainforest Connection' }
                if (title && ${isDarkMode}) { title.style.color = "#fff" }
                let titleSignUp = document.getElementsByTagName('h3')[1]
                if (titleSignUp) { titleSignUp.textContent= 'Rainforest Connection' }
                if (titleSignUp && ${isDarkMode}) { titleSignUp.style.color = "#fff" }
                let html = document.getElementsByTagName('html')[0]
                if (html && ${isDarkMode})
                { html.style.backgroundColor = '#131525' }
                let body = document.getElementsByTagName('body')[0]
                if (body && ${isDarkMode})
                { body.style.backgroundColor = '#131525' }`
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
