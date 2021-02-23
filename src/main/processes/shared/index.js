import { app } from 'electron'
import store from '../../../renderer/store'

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
  async clearAllData () {
    await store.dispatch('entities/deleteAll')
    await store.dispatch('reset', {})
  }
}
