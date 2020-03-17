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
const setupEvents = require('./../../setupEvents')
const log = require('electron-log')
console.log = log.log
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */

if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow, backgroundAPIWindow, trayWindow, aboutWindow, updatePopupWindow, preferencesPopupWindow
let menu, tray, idToken, isManualUpdateCheck
let refreshIntervalTimeout, expires, updateIntervalTimeout
let willQuitApp = false
let isLogOut = false
let dayInMs = 60 * 60 * 24 * 1000
// let weekInMs = dayInMs * 7
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

const updateURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/update`
  : `file://${__dirname}/index.html#/update`

const preferencesURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/preferences`
  : `file://${__dirname}/index.html#/preferences`

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
    // setTimeout(() => {
    //   if (global.newVersion && !updatePopupWindow) {
    //     createUpdatePopupWindow(true)
    //   }
    // }, 15000)
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
      if (preferencesPopupWindow) {
        preferencesPopupWindow.destroy()
        preferencesPopupWindow = null
      }
      if (updatePopupWindow) {
        updatePopupWindow.destroy()
        updatePopupWindow = null
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
  createPreferencesPopupWindow(false)
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

function createUpdatePopupWindow (isShow) {
  updatePopupWindow = new BrowserWindow({
    width: 500,
    height: 300,
    show: isShow,
    frame: true,
    transparent: false,
    backgroundColor: '#131525',
    titleBarStyle: 'default',
    webPreferences: { nodeIntegration: true }
  })

  updatePopupWindow.removeMenu()
  updatePopupWindow.loadURL(updateURL)

  updatePopupWindow.on('close', () => {
    console.log('updatePopupWindow close')
    updatePopupWindow = null
  })

  updatePopupWindow.on('closed', () => {
    console.log('updatePopupWindow closed')
    if (updatePopupWindow) {
      updatePopupWindow.destroy()
      updatePopupWindow = null
    }
  })
}

function createPreferencesPopupWindow (isShow) {
  preferencesPopupWindow = new BrowserWindow({
    width: 500,
    height: 300,
    show: isShow,
    frame: true,
    transparent: false,
    title: 'SETTINGS',
    backgroundColor: '#131525',
    titleBarStyle: 'default',
    webPreferences: { nodeIntegration: true }
  })

  preferencesPopupWindow.removeMenu()

  preferencesPopupWindow.on('close', () => {
    console.log('preferencesPopupWindow close')
    preferencesPopupWindow = null
  })

  preferencesPopupWindow.on('closed', () => {
    console.log('preferencesPopupWindow closed')
    if (preferencesPopupWindow) {
      preferencesPopupWindow.destroy()
      preferencesPopupWindow = null
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
        { label: 'Preferences',
          click: function () {
            if (preferencesPopupWindow) {
              preferencesPopupWindow.destroy()
              preferencesPopupWindow = null
            }
            if (preferencesURL) {
              createPreferencesPopupWindow(true)
              preferencesPopupWindow.loadURL(preferencesURL)
              preferencesPopupWindow.show()
            } else preferencesPopupWindow.loadURL(preferencesURL)
          }
        },
        { label: 'Check for Updates',
          click: function () {
            if (updatePopupWindow) {
              updatePopupWindow.destroy()
              updatePopupWindow = null
            }
            isManualUpdateCheck = true
            checkForUpdates()
          }
        },
        { label: 'About Ingest App',
          click: function () {
            if (aboutWindow) {
              aboutWindow.destroy()
              aboutWindow = null
            }
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
      darkMode: true,
      auto_update_app: true
    })
  }
  if (settings.get('settings.darkMode') === undefined) {
    settings.set('settings.darkMode', true)
  }
  if (settings.get('settings.auto_update_app') === undefined) {
    settings.set('settings.auto_update_app', true)
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

function resetUpdateTimers () {
  if (updateIntervalTimeout) {
    clearInterval(updateIntervalTimeout)
  }
}

function resetTimers () {
  if (refreshIntervalTimeout) {
    clearInterval(refreshIntervalTimeout)
  }
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

function createAutoUpdaterSub () {
  let platform = os.platform() + '_' + os.arch()
  let version = process.env.NODE_ENV === 'development' ? `${process.env.npm_package_version}` : app.getVersion()
  // let updaterFeedURL = 'https://localhost:3030/update/' + platform + '/' + version
  let updaterFeedURL = ((process.env.NODE_ENV === 'development') ? 'https://localhost:3030/update/' : (settings.get('settings.production_env') ? 'https://ingest.rfcx.org/update/' : 'https://staging-ingest.rfcx.org/update/')) + platform + '/' + version
  autoUpdater.setFeedURL(updaterFeedURL)
  autoUpdater.on('error', message => {
    console.error('There was a problem updating the application', message)
  })
  autoUpdater.on('checking-for-update', () => console.log('checking-for-update'))
  autoUpdater.on('update-available', () => {
    console.log('update-available')
    isManualUpdateCheck = false
  })
  autoUpdater.on('update-not-available', () => {
    console.log('update-not-available')
    let messageForPopup
    if (process.platform === 'win32' || process.platform === 'win64') messageForPopup = `You don't have any updates.`
    else {
      messageForPopup = `You are up to date! RFCx Ingest App ${process.env.NODE_ENV === 'development' ? `${process.env.npm_package_version}` : app.getVersion()} is the latest version.`
    }
    if (isManualUpdateCheck) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        buttons: ['Ok'],
        message: messageForPopup,
        title: 'UP TO DATE',
        icon: path.join(__static, 'rfcx-logo-win.png')
      })
    }
    isManualUpdateCheck = false
  })
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    console.log('update-downloaded', releaseName, releaseNotes)
    if (releaseName) global.newVersion = releaseName
    if (releaseNotes) global.notes = releaseNotes
    if (!updatePopupWindow) {
      createUpdatePopupWindow(true)
    }
    if (settings.get('settings.auto_update_app') && (process.platform === 'darwin')) {
      updateApp()
    }
  })
}

function updateApp () {
  autoUpdater.quitAndInstall()
  setTimeout(() => {
    console.log('start updating')
    menu = null
    mainWindow = null
    if (backgroundAPIWindow) {
      backgroundAPIWindow = null
    }
    if (preferencesPopupWindow) {
      preferencesPopupWindow.destroy()
      preferencesPopupWindow = null
    }
    if (updatePopupWindow) {
      updatePopupWindow.destroy()
      updatePopupWindow = null
    }
    if (aboutWindow) {
      aboutWindow.destroy()
      aboutWindow = null
    }
    resetTimers()
    app.exit()
    app.quit()
  }, 2000)
}

function createUpdateInterval () {
  updateIntervalTimeout = setInterval(() => {
    checkForUpdates()
  }, dayInMs)
}

function checkForUpdates () {
  console.log('checkForUpdates')
  autoUpdater.checkForUpdates()
}
app.commandLine.appendArgument('--enable-features=Metal')
app.on('ready', () => {
  if (setupEvents.handleSquirrelEvent(app)) return
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
  let openedAsHidden = false
  if (process.platform === 'darwin') openedAsHidden = app.getLoginItemSettings().wasOpenedAsHidden
  else openedAsHidden = (process.argv || []).indexOf('--hidden') !== -1
  console.log('open as hidden', openedAsHidden)
  initialSettings()
  createAppWindow(openedAsHidden)
  global.version = process.env.NODE_ENV === 'development' ? `${process.env.npm_package_version}` : app.getVersion()
  global.platform = (process.platform === 'win32' || process.platform === 'win64') ? 'win' : 'mac'
  createAutoUpdaterSub()
  if (settings.get('settings.auto_update_app')) {
    checkForUpdates()
    createUpdateInterval()
  }
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

let listenerOfToken = (event, args) => {
  event.sender.send('sendIdToken', idToken)
}

ipcMain.on('getIdToken', listenerOfToken)

async function listenerOfRefreshToken (event, args) {
  await refreshTokens()
  await checkToken()
  await hasAccessToApp()
  event.sender.send('sendRefreshToken')
}

ipcMain.on('getRefreshToken', listenerOfRefreshToken)

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

ipcMain.on('closeUpdatePopupWindow', () => {
  console.log('closeUpdatePopupWindow')
  if (updatePopupWindow) {
    updatePopupWindow.destroy()
    updatePopupWindow = null
  }
})

ipcMain.on('updateVersion', () => {
  updateApp()
})

ipcMain.on('changeAutoUpdateApp', () => {
  if (settings.get('settings.auto_update_app')) {
    checkForUpdates()
    createUpdateInterval()
  } else { resetUpdateTimers() }
})

export default {
  createWindow,
  hasAccessToApp
}
