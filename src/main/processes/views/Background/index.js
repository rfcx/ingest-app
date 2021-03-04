import { BrowserWindow, powerMonitor, powerSaveBlocker } from 'electron'

var suspendPowerSaveBlockerId
var lockScreenPowerSaveBlockerId

async function stopPowerSaveBlocker (id) {
  if (!id) return
  powerSaveBlocker.stop(id)
  Promise.resolve()
}

export default {
  createWindow () {
    console.log('background process: createWindow')
    const backgroundAPIURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080/#/api-service` : `file://${__dirname}/index.html#/api-service`
    const backgroundAPIWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: true }
    })
    backgroundAPIWindow.loadURL(backgroundAPIURL)

    powerMonitor.on('lock-screen', () => {
      console.log('------------The system is going to lock screen ----------')
      lockScreenPowerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep')
      console.log('powerSaveBlocker for sleep is started', powerSaveBlocker.isStarted(lockScreenPowerSaveBlockerId))
    })

    powerMonitor.on('suspend', () => {
      console.log('------------The system is going to suspend----------')
      // Pause uploading process if the app hasn't an internet connection
      suspendPowerSaveBlockerId = powerSaveBlocker.start('prevent-app-suspension')
      console.log('powerSaveBlocker for suspension is started', powerSaveBlocker.isStarted(suspendPowerSaveBlockerId))
    })
    powerMonitor.on('resume', () => {
      console.log('------------The system is going to resume-----------')
      // Continue uploading process if the app has an internet connection
      stopPowerSaveBlocker(suspendPowerSaveBlockerId).then(() => {
        suspendPowerSaveBlockerId = null
        console.log('powerSaveBlocker for suspend is cleared')
      })
      stopPowerSaveBlocker(lockScreenPowerSaveBlockerId).then(() => {
        lockScreenPowerSaveBlockerId = null
        console.log('powerSaveBlocker for sleep is cleared')
      })
    })

    return backgroundAPIWindow
  }
}
