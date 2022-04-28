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
      webPreferences: { nodeIntegration: true, backgroundThrottling: true }
    })
    backgroundAPIWindow.loadURL(backgroundAPIURL)

    // Monitor process
    backgroundAPIWindow.webContents.on('crashed', (event, killed) => {
      console.log('💥 backgroundAPIWindow on crashed event:', event)
      setTimeout(() => { // delay to prevent app crash https://github.com/electron/electron/issues/23291
        backgroundAPIWindow.reload()
      }, 5000)
    })

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

    // ipcMain.on(DatabaseEventName.eventsName.updateFilesDoNotExistRequest, async function (event, files) {
    //   try {
    //     await database.updateFilesDoNotExist(files)
    //     event.sender.send(DatabaseEventName.eventsName.updateFilesDoNotExistResponse)
    //   } catch (e) {
    //     console.error('Can not call database method', e)
    //   }
    // })

    return backgroundAPIWindow
  }
}
