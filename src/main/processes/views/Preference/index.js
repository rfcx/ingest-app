import { BrowserWindow, ipcMain } from 'electron'
import settings from 'electron-settings'
import updateProcess from '../Update/index'

export default {
  createWindow (isShow) {
    console.info('[PrefWindow] createWindow')
    const preferencesURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080/#/preferences` : `file://${__dirname}/index.html#/preferences`
    const preferencesPopupWindow = new BrowserWindow({
      width: 500,
      height: 300,
      show: isShow,
      frame: true,
      transparent: false,
      title: 'SETTINGS',
      backgroundColor: '#060508',
      titleBarStyle: 'default',
      webPreferences: { nodeIntegration: true }
    })

    preferencesPopupWindow.removeMenu()
    preferencesPopupWindow.loadURL(preferencesURL)

    preferencesPopupWindow.on('closed', () => {
      if (preferencesPopupWindow) {
        preferencesPopupWindow.destroy()
      }
    })

    ipcMain.on('changeAutoUpdateApp', () => {
      if (settings.get('settings.auto_update_app')) {
        updateProcess.checkForUpdates()
        updateProcess.createUpdateInterval()
      } else { updateProcess.resetUpdateInterval() }
    })

    return preferencesPopupWindow
  }
}
