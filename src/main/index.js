'use strict'

import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, dialog, autoUpdater } from 'electron'
import '../renderer/store'
import Stream from '../renderer/store/models/Stream'
import File from '../renderer/store/models/File'
import trayContainer from 'electron-tray-window'
import settings from 'electron-settings'
import createAuthWindow from './services/auth-process'
import authService from './services/auth-service'
import userService from './services/user-service'
import fileWatcher from './services/file-watcher'
const path = require('path')
const jwtDecode = require('jwt-decode')
const { shell } = require('electron')
const os = require('os')
const log = require('electron-log')
console.log = log.log
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

// let mainWindow, backgroundAPIWindow, backgroundFSWindow, trayWindow
let mainWindow, backgroundAPIWindow, trayWindow, aboutWindow
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

const trayURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/tray`
  : `file://${__dirname}/index.html#/tray`

const aboutURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/about`
  : `file://${__dirname}/index.html#/about`

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
      if (aboutWindow) {
        aboutWindow.destroy()
        aboutWindow = null
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
  createAboutUrl(false)
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

function createAboutUrl (isShow) {
  aboutWindow = new BrowserWindow({
    width: 300,
    height: 200,
    show: isShow,
    frame: true,
    transparent: false,
    backgroundColor: '#131525',
    titleBarStyle: 'default',
    webPreferences: { nodeIntegration: true }
  })

  aboutWindow.removeMenu()

  aboutWindow.on('close', () => {
    console.log('aboutWindow close')
    aboutWindow = null
  })

  aboutWindow.on('closed', () => {
    console.log('aboutWindow closed')
    if (aboutWindow) {
      aboutWindow.destroy()
      aboutWindow = null
    }
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
            mainWindow.webContents.send('switchDarkMode', darkMode)
          }
        },
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
        { label: 'Quit',
          click: function () {
            app.exit()
            app.quit()
          }
        },
        { type: 'separator' },
        { label: 'About Ingest App',
          click: function () {
            if (aboutURL) {
              createAboutUrl(true)
              aboutWindow.loadURL(aboutURL)
              aboutWindow.show()
            } else aboutWindow.loadURL(aboutURL)
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
    // {
    //   role: 'help',
    //   submenu: [
    //     {
    //       label: 'Learn More',
    //       click: async () => {
    //         const { shell } = require('electron')
    //         await shell.openExternal('https://electronjs.org')
    //       }
    //     }
    //   ]
    // }
  ]
  menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createTray (platform) {
  const iconPath = platform === 'darwin' ? path.join(__static, 'rfcx-logo.png') : path.join(__static, 'rfcx-logo-win.png')
  var trayIcon = nativeImage.createFromPath(iconPath)
  trayIcon = trayIcon.resize({ width: 12, height: 17 })
  tray = new Tray(trayIcon)
  trayContainer.setOptions({tray: tray, window: trayWindow})
}

function showMainWindow () {
  console.log('showMainWindow')
  if (mainWindow === null) {
    createWindow()
  } else {
    mainWindow.show()
  }
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

function initialSettings () {
  if (settings.get('settings') === undefined) {
    settings.set('settings', {
      auto_start: false,
      production_env: true,
      platform: 'amazon',
      darkMode: true
    })
  }
  if (settings.get('settings.darkMode') === undefined) {
    settings.set('settings.darkMode', true)
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

async function checkUserPermissions () {
  console.log('checkUserRole')
  return new Promise(async (resolve, reject) => {
    if (!idToken) {
      idToken = await authService.getIdToken()
      if (!idToken) return resolve(false)
    }
    let profile = jwtDecode(idToken)
    let appMetadata = 'https://rfcx.org/app_metadata'
    let userMetadata = 'https://rfcx.org/user_metadata'
    if (profile && profile.roles && (profile.roles || []).includes('rfcxUser')) {
      return resolve(profile[userMetadata] && !!profile[userMetadata].consentGiven)
    } else if (profile && profile[appMetadata] && profile[appMetadata].authorization && (profile[appMetadata].authorization.roles || []).includes('rfcxUser')) {
      return resolve(profile[userMetadata] && !!profile[userMetadata].consentGiven)
    } else return resolve(false)
  })
}

async function hasAccessToApp () {
  global.hasAccessToApp = await checkUserPermissions()
}

async function getUserInfo () {
  console.log('getUserInfo')
  return new Promise(async (resolve, reject) => {
    if (!idToken) {
      idToken = await authService.getIdToken()
      if (!idToken) return reject(new Error('no id token available'))
    }
    let profile = jwtDecode(idToken)
    let appMetadata = 'https://rfcx.org/app_metadata'
    let userMetadata = 'https://rfcx.org/user_metadata'
    if (profile && profile.given_name) {
      global.firstname = profile.given_name
    } else if (profile && profile[userMetadata] && profile[userMetadata].given_name) {
      global.firstname = profile[userMetadata].given_name
    }
    if (profile && profile[appMetadata]) {
      global.accessibleSites = profile[appMetadata].accessibleSites
      global.defaultSite = profile[appMetadata].defaultSite
    }
    if (profile && profile.picture) {
      global.picture = profile.picture
    }
    if (profile && profile.guid) {
      global.userId = profile.guid
    }
    if (profile && profile.roles) {
      global.roles = profile.roles
    }
    global.consentGiven = profile && profile[userMetadata] && profile[userMetadata].consentGiven === true
    await setAllUserSitesInfo()
    resolve()
  })
}

async function setAllUserSitesInfo () {
  global.allSites = await userService.getUserSites(idToken)
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
  global.version = process.env.NODE_ENV === 'development' ? `${process.env.npm_package_version}` : app.getVersion()
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

async function listen (event, args) {
  await refreshTokens()
  await checkToken()
  await hasAccessToApp()
  event.sender.send('sendRefreshToken')
}

ipcMain.on('getRefreshToken', listen)

ipcMain.on('focusFolder', (event, data) => {
  console.log('focusFolder')
  shell.openItem(data)
})

ipcMain.on('subscribeToFileWatcher', async function (event, streams) {
  console.log('subscribeToFileWatcher', streams)
  if (streams && streams.length) {
    for (let stream of streams) {
      await fileWatcher.subscribeStream(stream)
    }
  }
})

let platform = os.platform() + '_' + os.arch()
let version = process.env.NODE_ENV === 'development' ? `${process.env.npm_package_version}` : app.getVersion()
let updaterFeedURL = 'https://localhost:3030/ingest-app/update/' + platform + '/' + version
autoUpdater.setFeedURL(updaterFeedURL)
autoUpdater.on('error', message => { console.error('There was a problem updating the application', message) })
autoUpdater.on('checking-for-update', () => console.log('checking-for-update'))
autoUpdater.on('update-available', () => console.log('update-available'))
autoUpdater.on('update-not-available', () => console.log('update-not-available'))
autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  console.log('update-downloaded', event, releaseNotes, releaseName)
  dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Update', 'Cancel'],
    defaultId: 0,
    message: `Version ${releaseName} is available, do you want to install it now?`,
    title: 'Update available'
  }, response => {
    if (response === 0) {
      autoUpdater.quitAndInstall()
      setTimeout(() => {
        console.log('mainWindow exit')
        menu = null
        mainWindow = null
        if (backgroundAPIWindow) {
          backgroundAPIWindow = null
        }
        if (aboutWindow) {
          aboutWindow.destroy()
          aboutWindow = null
        }
        resetTimers()
        app.exit()
        app.quit()
      }, 3000)
    }
  })
})
autoUpdater.checkForUpdates()
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
