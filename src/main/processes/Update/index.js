import { autoUpdater } from 'electron'

let updateIntervalTimeout
let dayInMs = 60 * 60 * 24 * 1000

export default {
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
