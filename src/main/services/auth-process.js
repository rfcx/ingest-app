import { BrowserWindow, Menu, app } from 'electron'
import authService from './auth-service'
import index from '../index'
import settings from 'electron-settings'

const filter = {
  urls: ['file:///callback*']
}
let win = null
let menu, currentUrl

function createAuthWindow () {
  console.log('createAuthWindow')
  let isDarkMode = settings.get('settings.darkMode')
  createMenu()
  win = new BrowserWindow({
    width: 615,
    height: 650,
    webPreferences: {
      nodeIntegration: false
    }
  })
  const {
    session: { webRequest }
  } = win.webContents
  win.loadURL(authService.getAuthenticationURL(), { userAgent: 'Chrome' })
  currentUrl = authService.getAuthenticationURL()
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
  win.webContents.on('did-redirect-navigation', (event, url) => {
    if (currentUrl !== url) {
      if (url.includes('https://rfcx.eu.auth0.com/login')) {
        menu.items[0].submenu.items[2].enabled = false
        return
      }
      menu.items[0].submenu.items[2].enabled = true
      createBackButton()
    }
  })
  win.webContents.on('did-frame-finish-load', (event, isMainFrame, frameProcessId, frameRoutingId) => {
    let url = event.sender.getURL()
    if (url.includes('&lp=1&hl=')) {
      createBackButton()
    }
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
        { label: 'Back to Login page',
          type: 'checkbox',
          click: function () {
            win.loadURL(authService.getAuthenticationURL(), { userAgent: 'Chrome' })
            menu.items[0].submenu.items[2].enabled = false
            menu.items[0].submenu.items[2].checked = false
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
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
      ]
    }
  ]
  menu = Menu.buildFromTemplate(template)
  menu.items[0].submenu.items[2].enabled = false
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

function getUrl () {
  return authService.getAuthenticationURL()
}

function createBackButton () {
  let code = `body = document.getElementsByTagName('body')[0]
  if (body) {
  body.style.position = 'relative'
  body.style.overflowX = 'hidden'
  let btn = document.createElement('button')
  body.appendChild(btn)
  btn.innerHTML = 'Back'
  btn.style.position = 'absolute'; btn.style.top = '20%'; btn.style.left = '10px'
  btn.style.fontSize = '16px'; btn.style.padding = '3px 10px'; btn.style.borderRadius = '3px';
  btn.style.cursor = 'pointer'; btn.style.zIndex = '1000'
  btn.onclick = function() {
  body.removeChild(btn)
  location.href = "${getUrl()}" }
  }`
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
