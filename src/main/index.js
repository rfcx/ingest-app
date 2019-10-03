'use strict'

import { app, BrowserWindow, ipcMain } from 'electron'
import '../renderer/store'
// import API from '../../utils/api'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow, backgroundAPIWindow, backgroundFSWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

const backgroundAPIURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/api-service`
  : `file://${__dirname}/index.html#/api-service`

const backgroundFSURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/fs-service`
  : `file://${__dirname}/index.html#/fs-service`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    useContentSize: true,
    width: 1000,
    height: 563,
    minWidth: 400
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  backgroundAPIWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true }
  })
  backgroundAPIWindow.loadURL(backgroundAPIURL)

  backgroundFSWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true }
  })
  backgroundFSWindow.loadURL(backgroundFSURL)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('newStreamAdded', (event, data) => {
  console.log('on newStreamAdded')
  console.log(event)
  console.log(data)
  backgroundAPIWindow.webContents.send('hasNewStreamAdded', data)
})

/*
ipcMain.on('queuedUnsyncFiles', (event, data) => {
  console.log('on queuedUnsyncFiles')
  console.log(event)
  console.log(data)
  data.forEach((file) => {
    uploadFile(event, file)
  })
})

function uploadFile (event, file) {
  API.uploadFile((progress) => {
    console.log('uploadFile progress')
    const updatedFile = {file: file, state: {id: 'uploading', message: progress}}
    event.reply('updateProgress', updatedFile)
  }, () => {
    console.log('uploadFile success')
    const updatedFile = {file: file, state: {id: 'completed', message: ''}}
    event.reply('updateProgress', updatedFile)
  }, (error) => {
    console.log('uploadFile error')
    const updatedFile = {file: file, state: {id: 'failed', message: error}}
    event.reply('updateProgress', updatedFile)
  })
}
*/
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
