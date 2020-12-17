import { app, remote, ipcMain, BrowserWindow, autoUpdater } from 'electron'
import settings from 'electron-settings'
const os = require('os')

let updateIntervalTimeout
let dayInMs = 60 * 60 * 24 * 1000
const updateURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080/#/update` : `file://${__dirname}/index.html#/update`

export default {
  createWindow (isShow) {
    const updatePopupWindow = new BrowserWindow({
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

    updatePopupWindow.on('closed', () => {
      console.log('updatePopupWindow closed')
      updatePopupWindow.destroy()
    })

    ipcMain.on('closeUpdatePopupWindow', () => {
      console.log('closeUpdatePopupWindow')
      updatePopupWindow.destroy()
    })

    return updatePopupWindow
  },
  createAutoUpdaterSub () {
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
    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
      console.log('update-downloaded', releaseName, releaseNotes)
      if (releaseName) global.newVersion = releaseName
      if (releaseNotes) global.notes = releaseNotes
      const currentURL = remote.getCurrentWindow().webContents.getURL()
      if (currentURL && currentURL === this.updateURL) { return }
      this.createWindow(true)
    })
  },
  checkForUpdates () {
    console.log('auto update process: checkForUpdates')
    autoUpdater.checkForUpdates()
  },
  createUpdateInterval () {
    console.log('auto update process: createUpdateInterval')
    updateIntervalTimeout = setInterval(() => {
      this.checkForUpdates()
    }, dayInMs)
  },
  resetUpdateInterval () {
    console.log('auto update process: resetUpdateInterval')
    if (updateIntervalTimeout) {
      clearInterval(updateIntervalTimeout)
    }
  }
}
