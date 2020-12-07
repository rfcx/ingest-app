'use strict'

import { app, BrowserWindow, ipcMain, autoUpdater, powerMonitor } from 'electron'
import menuProcess from '../main/processes/Menu/index'
import aboutProcess from '../main/processes/About/index'
import store from '../renderer/store'
import Stream from '../renderer/store/models/Stream'
import File from '../renderer/store/models/File'
import settings from 'electron-settings'
import createAuthWindow from './services/auth-process'
import authService from './services/auth-service'
const path = require('path')
const jwtDecode = require('jwt-decode')
const { shell } = require('electron')
const os = require('os')
const setupEvents = require('./../../setupEvents')
const log = require('electron-log')
console.log = log.log
log.transports.console.format = '{h}:{i}:{s} {text}'
log.transports.file.getFile()

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */

if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}
let mainWindow, backgroundAPIWindow, aboutWindow, updatePopupWindow, preferencesPopupWindow
let idToken
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

const updateURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/update`
  : `file://${__dirname}/index.html#/update`

const preferencesURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/preferences`
  : `file://${__dirname}/index.html#/preferences`

function createWindow (openedAsHidden = false) {
  createRefreshInterval()
  if (!idToken) getIdToken()
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
    backgroundColor: '#131525',
    webPreferences: { nodeIntegration: true }
  })

  mainWindow.on('closed', () => {
    resetTimers()
    mainWindow = null
  })

  mainWindow.on('close', (e) => {
    if (mainWindow.isFullScreen()) {
      mainWindow.once('leave-full-screen', (e1) => {
        mainWindow.hide()
      })
      mainWindow.setFullScreen(false)
    }
    closeMainWindow(e)
  })

  mainWindow.loadURL(winURL)

  backgroundAPIWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true }
  })
  backgroundAPIWindow.loadURL(backgroundAPIURL)
  aboutWindow = aboutProcess.createWindow(false)
  aboutWindow.on('closed', () => {
    aboutWindow = null
  })
  createPreferencesPopupWindow(false)

  powerMonitor.on('suspend', () => {
    console.log('------------The system is going to suspend----------')
    // Pause uploading process if the app hasn't an internet connection
    backgroundAPIWindow.webContents.send('suspendApp', false)
  })
  powerMonitor.on('resume', () => {
    console.log('------------The system is going to resume-----------')
    // Continue uploading process if the app has an internet connection
    if (settings.get('settings.onLine')) {
      backgroundAPIWindow.webContents.send('suspendApp', true)
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
  const logoutFn = async () => {
    console.log('logOut')
    logOut()
  }

  const prefFn = function () {
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

  const updateFn = function () {
    if (updatePopupWindow) {
      updatePopupWindow.destroy()
      updatePopupWindow = null
    }
    checkForUpdates()
  }

  const aboutFn = function () {
    if (!aboutWindow) {
      aboutWindow = aboutProcess.createWindow(true)
    }
    aboutWindow.show()
  }
  menuProcess.createMenu(logoutFn, prefFn, aboutFn, updateFn)
}

function showMainWindow () {
  console.log('showMainWindow')
  if (mainWindow === null) {
    createWindow()
  } else {
    mainWindow.show()
  }
}

function closeMainWindow (e) {
  console.log('closeMainWindow willQuitApp', willQuitApp)
  if (willQuitApp) {
    console.log('mainWindow exit')
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
      mainWindow = null
      resetTimers()
      app.exit()
      app.quit()
      return
    }
    e.preventDefault()
    mainWindow.hide()
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
      auto_update_app: true,
      onLine: true
    })
  }
  if (settings.get('settings.auto_update_app') === undefined) {
    settings.set('settings.auto_update_app', true)
  }
  if (settings.get('settings.onLine') === undefined) {
    settings.set('settings.onLine', true)
  }
  setLoginItem(settings.get('settings.auto_start'))
}

async function createAppWindow (openedAsHidden) {
  try {
    // An Entry for users who has already existing token
    await authService.getIdToken()
    await checkToken()
    await getUserInfo()
    console.log('create main window')
    createWindow(openedAsHidden)
    resetFirstLogInCondition()
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

async function getIdToken () {
  idToken = await authService.getIdToken()
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
    global.consentGiven = profile && profile[userMetadata] && profile[userMetadata].consentGiven !== undefined &&
      profile[userMetadata].consentGiven.toString() === 'true'
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
  settings.set('settings.production_env', true)
  clearAllData()
  hideMainWindowAndForceLogin()
  resetFirstLogInCondition()
}

function hideMainWindowAndForceLogin () {
  if (mainWindow) {
    isLogOut = true
    mainWindow.close()
  }
  idToken = null
}

function clearAllData () {
  File.deleteAll()
  Stream.deleteAll()
  store.dispatch('reset', {})
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

function resetFirstLogInCondition () {
  global.firstLogIn = false
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
  })
  autoUpdater.on('update-not-available', () => {
    console.log('update-not-available')
    if (mainWindow) {
      mainWindow.webContents.send('showUpToDatePopup', true)
    }
  })
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    console.log('update-downloaded', releaseName, releaseNotes)
    if (releaseName) global.newVersion = releaseName
    if (releaseNotes) global.notes = releaseNotes
    if (!updatePopupWindow) {
      createUpdatePopupWindow(true)
    }
  })
}

function updateApp () {
  autoUpdater.quitAndInstall()
  setTimeout(() => {
    console.log('start updating')
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

function checkIngestServicelUrl () {
  if (process.env.npm_config_url) {
    global.ingestServicelUrl = process.env.npm_config_url
  }
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
  checkIngestServicelUrl()
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
})

ipcMain.on('logOut', (event, data) => {
  console.log('logOut')
  logOut()
})

let listenerOfToken = (event, args) => {
  if (!idToken) { // if there is no idToken, then force user to login again
    hideMainWindowAndForceLogin()
    return
  }
  event.sender.send('sendIdToken', idToken)
}

ipcMain.on('getIdToken', listenerOfToken)

async function listenerOfRefreshToken (event, args) {
  await refreshTokens()
  await checkToken()
  event.sender.send('sendRefreshToken')
}

ipcMain.on('getRefreshToken', listenerOfRefreshToken)

ipcMain.on('focusFolder', (event, data) => {
  console.log('focusFolder')
  shell.openItem(data)
})

ipcMain.on('setUploadingProcess', (event, data) => {
  console.log('setUploadingProcess', data)
})

ipcMain.on('deleteFiles', async function (event, ids) {
  console.log('deleteFiles', ids)
  await Promise.all(ids.map(id => File.delete(id)))
  event.sender.send('filesDeleted')
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

ipcMain.on('resetFirstLogIn', () => {
  resetFirstLogInCondition()
})

ipcMain.on('changeAutoUpdateApp', () => {
  if (settings.get('settings.auto_update_app')) {
    checkForUpdates()
    createUpdateInterval()
  } else { resetUpdateTimers() }
})

export default {
  createWindow
}
