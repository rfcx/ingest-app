import { app, BrowserWindow, ipcMain } from 'electron'
import dbService from '../../../services/db/sqlite'

export default {
  async createWindow () {
    console.log('db process: createWindow')
    const dbURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080/static/empty.html` : `file://${__dirname}/static/empty.html`
    const dbWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: true, backgroundThrottling: true }
    })
    dbWindow.loadURL(dbURL)

    await dbService.init(app)

    Object.keys(dbService.collections).forEach((collection) => {
      Object.keys(dbService.collections[collection]).forEach((method) => {
        const topic = `db.${collection}.${method}`
        ipcMain.on(topic, async function (event, callbackTopic, data) {
          try {
            const result = await dbService.collections[collection][method](data)
            event.sender.send(callbackTopic, result)
          } catch (e) {
            console.error('Failed to call db method', e)
            event.sender.send(callbackTopic, e)
          }
        })
      })
    })

    return dbWindow
  }
}
