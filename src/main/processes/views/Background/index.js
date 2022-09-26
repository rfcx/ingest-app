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
    console.info('[BGWindow] createWindow')
    const backgroundAPIURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080/#/api-service` : `file://${__dirname}/index.html#/api-service`
    const backgroundAPIWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: true, backgroundThrottling: true }
    })
    backgroundAPIWindow.loadURL(backgroundAPIURL)

    // Monitor process
    backgroundAPIWindow.webContents.on('crashed', (event, killed) => {
      console.error('💥 backgroundAPIWindow on crashed event:', event)
      setTimeout(() => { // delay to prevent app crash https://github.com/electron/electron/issues/23291
        backgroundAPIWindow.reload()
      }, 5000)
    })

    powerMonitor.on('lock-screen', () => {
      console.info('🔌 locking the screen')
      lockScreenPowerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep')
      console.info('- powerSaveBlocker for sleep is started', powerSaveBlocker.isStarted(lockScreenPowerSaveBlockerId))
    })

    powerMonitor.on('suspend', () => {
      console.info('🔌 suspending the system')
      // Pause uploading process if the app hasn't an internet connection
      suspendPowerSaveBlockerId = powerSaveBlocker.start('prevent-app-suspension')
      console.info('- powerSaveBlocker for suspension is started', powerSaveBlocker.isStarted(suspendPowerSaveBlockerId))
    })
    powerMonitor.on('resume', () => {
      console.info('🔌 resuming the system')
      // Continue uploading process if the app has an internet connection
      stopPowerSaveBlocker(suspendPowerSaveBlockerId).then(() => {
        suspendPowerSaveBlockerId = null
        console.info('- powerSaveBlocker for suspend is cleared')
      })
      stopPowerSaveBlocker(lockScreenPowerSaveBlockerId).then(() => {
        lockScreenPowerSaveBlockerId = null
        console.info('- powerSaveBlocker for sleep is cleared')
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
