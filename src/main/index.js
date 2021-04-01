'use strict'

import { app, ipcMain, BrowserWindow } from 'electron'
import { commonProcess, mainProcess, backgroundProcess, dbProcess, menuProcess, aboutProcess, preferenceProcess, updateProcess } from './processes'
import settings from 'electron-settings'
import createAuthWindow from './services/auth-process'
import authService from './services/auth-service'
const path = require('path')
const jwtDecode = require('jwt-decode')
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
let mainWindow, backgroundAPIWindow, dbWindow, aboutWindow, updatePopupWindow, preferencesPopupWindow
let idToken
let refreshIntervalTimeout, expires
let willQuitApp = false
let isLogOut = false
let dayInMs = 60 * 60 * 24 * 1000
// let weekInMs = dayInMs * 7
const gotTheLock = app.requestSingleInstanceLock()

function createWindow (openedAsHidden = false) {
  createRefreshInterval()
  if (!idToken) getIdToken()
  /**
   * Initial window options
   */
  createMenu()
  mainWindow = mainProcess.createWindow(!openedAsHidden,
    (e) => {
      if (mainWindow.isFullScreen()) {
        mainWindow.once('leave-full-screen', (e1) => {
          mainWindow.hide()
        })
        mainWindow.setFullScreen(false)
      }
      closeMainWindow(e)
    }, (e) => {
      resetTimers()
      mainWindow = null
    })

  backgroundAPIWindow = backgroundProcess.createWindow()
  dbWindow = dbProcess.createWindow()

  aboutWindow = aboutProcess.createWindow(false)

  preferencesPopupWindow = preferenceProcess.createWindow(false)
}

function createAutoUpdaterSub () {
  updateProcess.createAutoUpdaterSub(() => {
    // update not avaliable
    if (mainWindow) {
      mainWindow.webContents.send('showUpToDatePopup', true)
    }
  }, () => {
    // start updating process
    setTimeout(() => {
      console.log('start updating')
      mainWindow = null
      if (backgroundAPIWindow) {
        backgroundAPIWindow = null
      }
      if (dbWindow) {
        dbWindow = null
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
  })
}

function createMenu () {
  const logoutFn = async () => {
    console.log('logOut')
    logOut()
  }

  const prefFn = function () {
    if (!preferencesPopupWindow || preferencesPopupWindow.isDestroyed()) {
      preferencesPopupWindow = preferenceProcess.createWindow(true)
    }
    preferencesPopupWindow.show()
  }

  const updateFn = function () {
    if (updatePopupWindow) {
      updatePopupWindow.destroy()
      updatePopupWindow = null
    }
    updateProcess.checkForUpdates()
  }

  const aboutFn = function () {
    if (!aboutWindow || aboutWindow.isDestroyed()) {
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
    mainWindow.webContents.send('onMainWindowIsActive')
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
    if (dbWindow) {
      dbWindow = null
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
  commonProcess.setLoginItem(settings.get('settings.auto_start'))
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
    console.log('An Entry for new users: createAuthWindow', err)
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
  await commonProcess.clearAllData()
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

async function createRefreshInterval () {
  refreshIntervalTimeout = setInterval(() => {
    checkToken()
  }, dayInMs)
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

function checkIngestServicelUrl () {
  if (process.env.npm_config_url) {
    global.ingestServicelUrl = process.env.npm_config_url
  }
}
app.commandLine.appendArgument('--enable-features=Metal')
app.on('ready', async () => {
  if (`${process.env.VUE_DEV_TOOLS_ENABLED}` === 'true') {
    try {
      const os = require('os')
      // Install vue dev tools
      // TODO: the path should be configurable by the developer
      const devToolsPath = path.join(
        os.homedir(),
        '/Library/Application Support/Google/Chrome/Profile 2/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/5.3.4_0'
      )
      await BrowserWindow.addDevToolsExtension(devToolsPath)
    } catch (e) {
      console.error('Can not init vue dev tools', e)
    }
  }

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
  console.log('get setting')
  if (settings.get('settings.auto_update_app')) {
    updateProcess.checkForUpdates()
    updateProcess.createUpdateInterval()
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

ipcMain.on('setUploadingProcess', (event, data) => {
  console.log('setUploadingProcess', data)
})

ipcMain.on('resetFirstLogIn', () => {
  resetFirstLogInCondition()
})

ipcMain.on('client.message', function (event, data) {
  let client
  switch (data.client) {
    case 'api':
      client = backgroundAPIWindow
      break
    case 'preferences':
      client = preferencesPopupWindow
      break
    // add more if needed
  }
  if (client) {
    client.webContents.send(data.topic, data.content)
  }
})
// ipcMain.on('getFileDurationRequest', async function (event, files) {
//   console.log('getFileDurationRequest')
//   event.sender.send('getFileDurationTrigger')
//   backgroundAPIWindow.webContents.send('getFileDurationTrigger', files)
// })

export default {
  createWindow
}
