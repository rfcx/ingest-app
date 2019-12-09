'use strict'

import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } from 'electron'
import '../renderer/store'
import Stream from '../renderer/store/models/Stream'
import File from '../renderer/store/models/File'
import path from 'path'
import trayContainer from 'electron-tray-window'
import settings from 'electron-settings'
import createAuthWindow from './services/auth-process'
import authService from './services/auth-service'
const jwtDecode = require('jwt-decode')

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow, backgroundAPIWindow, backgroundFSWindow, trayWindow
let menu, tray, idToken
let refreshIntervalTimeout, expires
let willQuitApp = false
let isLogOut = false
let dayInMs = 60 * 60 * 24 * 1000
const gotTheLock = app.requestSingleInstanceLock()
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

const backgroundAPIURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/api-service`
  : `file://${__dirname}/index.html#/api-service`

const backgroundFSURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/fs-service`
  : `file://${__dirname}/index.html#/fs-service`

const trayURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/tray`
  : `file://${__dirname}/index.html#/tray`

function createWindow (openedAsHidden = false) {
  createRefreshInterval()
  /**
   * Initial window options
   */
  createMenu()
  mainWindow = new BrowserWindow({
    show: !openedAsHidden,
    useContentSize: true,
    width: 1000,
    height: 563,
    minWidth: 400,
    webPreferences: { nodeIntegration: true }
  })

  // mainWindow.webContents.once('dom-ready', () => mainWindow.webContents.openDevTools())

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('did-finish-load')
    backgroundAPIWindow.loadURL(backgroundAPIURL)
    backgroundFSWindow.loadURL(backgroundFSURL)
  })

  mainWindow.on('closed', () => {
    resetTimers()
    mainWindow = null
    menu = null
  })

  mainWindow.on('close', (e) => {
    if (willQuitApp) {
      console.log('mainWindow exit')
      menu = null
      mainWindow = null
      if (backgroundAPIWindow) {
        backgroundAPIWindow = null
      }
      if (backgroundAPIWindow) {
        backgroundFSWindow = null
      }
      resetTimers()
      app.exit()
      app.quit()
    } else if (isLogOut) {
      console.log('mainWindow logout')
      resetTimers()
      createAuthWindow()
      if (mainWindow) {
        mainWindow.destroy()
        mainWindow = null
      }
      idToken = null
      isLogOut = false
    } else {
      console.log('mainWindow close')
      if (process.platform === 'win32' || process.platform === 'win64') {
        menu = null
        mainWindow = null
        resetTimers()
        app.exit()
        app.quit()
        return
      }
      e.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.loadURL(winURL)

  backgroundAPIWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true }
  })

  backgroundFSWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true }
  })

  trayWindow = new BrowserWindow({
    width: 300,
    height: 350,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    useContentSize: true,
    webPreferences: { nodeIntegration: true }
  })
  trayWindow.loadURL(trayURL)

  trayWindow.on('blur', () => {
    if (!trayWindow.webContents.isDevToolsOpened()) {
      trayWindow.hide()
    }
  })

  trayWindow.on('close', () => {
    console.log('tray close')
    trayWindow = null
    tray = null
  })

  trayWindow.on('closed', () => {
    console.log('tray closed')
    trayWindow = null
    tray = null
  })

  createTray(process.platform)
}

function createMenu () {
  /* MENU */
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Clear data',
          click: async () => {
            console.log('clear data')
            File.deleteAll()
            Stream.deleteAll()
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
        { label: 'Log out',
          type: 'checkbox',
          click: async () => {
            await authService.logout()
            if (mainWindow) {
              isLogOut = true
              mainWindow.close()
            }
            if (tray) {
              tray.destroy()
              tray = null
            }
            if (trayWindow) {
              trayWindow.destroy()
              trayWindow = null
            }
            idToken = null
          }
        },
        // { role: 'quit' }
        { label: 'Quit',
          click: function () {
            app.exit()
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
      ]
    }
  ]
  menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createTray (platform) {
  const iconPath = path.join(__static, 'rfcx-logo.png')
  var trayIcon = nativeImage.createFromPath(iconPath)
  trayIcon = trayIcon.resize({ width: 12, height: 17 })
  tray = new Tray(trayIcon)
  // const trayMenu = Menu.buildFromTemplate([
  //   {
  //     label: 'Show App',
  //     click: function () {
  //       if (mainWindow === null) {
  //         createWindow()
  //       } else {
  //         mainWindow.show()
  //       }
  //     }
  //   },
  //   {
  //     label: 'Quit',
  //     click: function () {
  //       app.isQuiting = true
  //       app.quit()
  //     }
  //   }
  // ])
  // tray.setContextMenu(trayMenu)
  trayContainer.setOptions({tray: tray, window: trayWindow})
  // tray.on('click', function (event) {
  //   trayWindow.isVisible() ? trayWindow.hide() : showTrayWindow(platform)
  // })
}

// const showTrayWindow = (platform) => {
//   const position = getWindowPosition(platform)
//   trayWindow.setPosition(position.x, position.y, false)
//   trayWindow.show()
// }

// const getWindowPosition = (platform) => {
//   const windowBounds = trayWindow.getBounds()
//   const trayBounds = tray.getBounds()

//   let x, y
//   if (platform === 'darwin') {
//     // Center window horizontally below the tray icon
//     x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
//     // Position window 4 pixels vertically below the tray icon
//     y = Math.round(trayBounds.y + trayBounds.height + 4)
//   }
//   return {x: x, y: y}
// }

function showMainWindow () {
  console.log('showMainWindow')
  if (mainWindow === null) {
    createWindow()
  } else {
    mainWindow.show()
  }
}

// const appFolder = path.dirname(process.execPath)
// const updateExe = path.resolve(appFolder, '..', 'Update.exe')
// const exeName = path.basename(process.execPath)

function setLoginItem (openAtLogin) {
  console.log('setLoginItem', openAtLogin)
  const args = openAtLogin ? ['--process-start-args', `"--hidden"`] : []
  app.setLoginItemSettings({
    openAtLogin: openAtLogin,
    openAsHidden: openAtLogin,
    // path: updateExe,
    args: args
  })
}

function initialSettings () {
  if (settings.get('settings') === undefined) {
    settings.set('settings', {
      auto_start: false,
      production_env: false
    })
  }
  setLoginItem(settings.get('settings.auto_start'))
}

async function createAppWindow (openedAsHidden) {
  try {
    // An Entry for users who has already existing token
    await authService.getIdToken()
    await checkToken()
    await getUserInfo()
    await hasAccessToApp()
    console.log('create main window')
    createWindow(openedAsHidden)
  } catch (err) {
    // An Entry for new users
    console.log('createAuthWindow')
    createAuthWindow()
  }
}

async function checkToken () {
  console.log('checkToken')
  return new Promise(async (resolve, reject) => {
    idToken = null
    const now = Date.now()
    idToken = await authService.getIdToken()
    if (!idToken) return reject(new Error('no id token available'))
    let profile = jwtDecode(idToken)
    if (profile) {
      expires = profile.exp * 1000
      if (now > expires) {
        logOut()
        return resolve()
      } else if ((expires - now) <= dayInMs) {
        refreshTokens()
      }
    }
    resolve()
  })
}

async function checkUserRole () {
  console.log('checkUserRole')
  return new Promise(async (resolve, reject) => {
    if (!idToken) {
      idToken = await authService.getIdToken()
      if (!idToken) return resolve(false)
    }
    let profile = jwtDecode(idToken)
    console.log('roles', profile.roles)
    if (profile && profile.roles && (profile.roles || []).includes('rfcxUser')) {
      return resolve(true)
    } else if (profile && profile['https://rfcx.org/app_metadata'] && profile['https://rfcx.org/app_metadata'].authorization &&
      (profile['https://rfcx.org/app_metadata'].authorization.roles || []).includes('rfcxUser')) {
      return resolve(true)
    } else return resolve(false)
  })
}

async function hasAccessToApp () {
  global.hasAccessToApp = await checkUserRole()
}

async function getUserInfo () {
  console.log('getUserInfo')
  return new Promise(async (resolve, reject) => {
    if (!idToken) {
      idToken = await authService.getIdToken()
      if (!idToken) return reject(new Error('no id token available'))
    }
    let profile = jwtDecode(idToken)
    if (profile && profile.given_name) {
      global.firstname = profile.given_name
    } else if (profile && profile.user_metadata && profile.user_metadata.given_name) {
      global.firstname = profile.user_metadata.given_name
    }
    if (profile && profile['https://rfcx.org/app_metadata']) {
      global.accessibleSites = profile['https://rfcx.org/app_metadata'].accessibleSites
      global.defaultSite = profile['https://rfcx.org/app_metadata'].defaultSite
    }
    resolve()
  })
}

async function refreshTokens () {
  try {
    await authService.refreshTokens()
  } catch (err) {
    logOut()
  }
}

async function logOut () {
  await authService.logout()
  if (mainWindow) {
    isLogOut = true
    mainWindow.close()
  }
  if (tray) {
    tray.destroy()
    tray = null
  }
  if (trayWindow) {
    trayWindow.destroy()
    trayWindow = null
  }
  idToken = null
}

function removeTray () {
  if (tray) {
    tray.destroy()
    tray = null
  }
  if (trayWindow) {
    trayWindow.destroy()
    trayWindow = null
  }
}

async function createRefreshInterval () {
  refreshIntervalTimeout = setInterval(() => {
    checkToken()
  }, dayInMs)
}

function resetTimers () {
  clearInterval(refreshIntervalTimeout)
}
if (!gotTheLock) {
  app.exit()
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // When run a second instance.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
app.on('ready', () => {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
  let openedAsHidden = false
  if (process.platform === 'darwin') openedAsHidden = app.getLoginItemSettings().wasOpenedAsHidden
  else openedAsHidden = (process.argv || []).indexOf('--hidden') !== -1
  console.log('open as hidden', openedAsHidden)
  initialSettings()
  createAppWindow(openedAsHidden)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    console.log('window-all-closed')
    app.quit()
  }
})

app.on('before-quit', () => {
  console.log('before-quit')
  willQuitApp = true
})

app.on('activate', () => {
  console.log('activate')
  if (mainWindow && idToken) {
    showMainWindow()
  } else app.focus()
})

ipcMain.on('openMainWindow', (event, data) => {
  showMainWindow()
  if (trayWindow) {
    trayWindow.hide()
  }
})

ipcMain.on('logOut', (event, data) => {
  console.log('logOut')
  logOut()
})

ipcMain.on('removeTray', (event, data) => {
  console.log('removeTray')
  removeTray()
})

let listener = (event, args) => {
  event.sender.send('sendIdToken', idToken)
}

ipcMain.on('getIdToken', listener)

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */

export default {
  createWindow,
  hasAccessToApp
}
