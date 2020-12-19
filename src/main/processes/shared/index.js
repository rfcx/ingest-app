import { app } from 'electron'
import store from '../../../renderer/store'
import Stream from '../../../renderer/store/models/Stream'
import File from '../../../renderer/store/models/File'

export default {
  setLoginItem (openAtLogin) {
    console.log('setLoginItem', openAtLogin)
    const args = openAtLogin ? ['--process-start-args', `"--hidden"`] : []
    app.setLoginItemSettings({
      openAtLogin: openAtLogin,
      openAsHidden: openAtLogin,
      args: args
    })
  },
  resetFirstLogInCondition () {
    global.firstLogIn = false
  },
  clearAllData () {
    File.deleteAll()
    Stream.deleteAll()
    store.dispatch('reset', {})
  }
}
