import { BrowserWindow, Menu, app } from 'electron'
import authService from './auth-service'
import index from '../index'
import settings from 'electron-settings'

const filter = {
  urls: ['file:///callback*']
}
let win = null
let menu

function createAuthWindow () {
  console.log('createAuthWindow')
  let isDarkMode = settings.get('settings.darkMode')
  createMenu()
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

function createMenu () {
  /* MENU */
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Dark mode',
          type: 'checkbox',
          checked: settings.get('settings.darkMode'),
          click: async () => {
            settings.set('settings.darkMode', !settings.get('settings.darkMode'))
            let darkMode = settings.get('settings.darkMode')
            console.log('dark mode', darkMode)
            switchDarkMode(darkMode)
          }
        },
        { label: 'Auto start',
          type: 'checkbox',
          checked: settings.get('settings.auto_start'),
          click: async (item) => {
            const existingSettings = settings.get('settings')
            existingSettings['auto_start'] = item.checked
            settings.set('settings', existingSettings)
            setLoginItem(item.checked)
          }
        },
        { label: 'Quit',
          click: async () => {
            await destroyAuthWin()
            app.exit()
            app.quit()
          }
        }
      ]
    }
  ]
  menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function switchDarkMode (darkMode) {
  let code = `title = document.getElementsByTagName('h3')[0]
  if (title && ${darkMode}) { title.style.color = "#fff" }
  else { title.style.color = "#000" }
  titleSignUp = document.getElementsByTagName('h3')[1]
  if (titleSignUp && ${darkMode}) { titleSignUp.style.color = "#fff" }
  else { titleSignUp.style.color = "#000" }
  html = document.getElementsByTagName('html')[0]
  if (html && ${darkMode}) { html.style.backgroundColor = '#131525' }
  else { html.style.backgroundColor = '#fff' }
  body = document.getElementsByTagName('body')[0]
  if (body && ${darkMode}) { body.style.backgroundColor = '#131525' }
  else { body.style.backgroundColor = '#fff' }`
  win.webContents.executeJavaScript(code)
}

function setLoginItem (openAtLogin) {
  console.log('setLoginItem', openAtLogin)
  const args = openAtLogin ? ['--process-start-args', `"--hidden"`] : []
  app.setLoginItemSettings({
    openAtLogin: openAtLogin,
    openAsHidden: openAtLogin,
    args: args
  })
}

export default createAuthWindow
