import { BrowserWindow } from 'electron'

export default {
  createWindow (isShow) {
    console.log('aboutprocess: createWindow')
    const aboutURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080/#/about` : `file://${__dirname}/index.html#/about`
    const aboutWindow = new BrowserWindow({
      width: 300,
      height: 200,
      show: isShow,
      frame: true,
      transparent: false,
      backgroundColor: '#060508',
      titleBarStyle: 'default',
      webPreferences: { nodeIntegration: true }
    })

    aboutWindow.loadURL(aboutURL)
    aboutWindow.removeMenu()

    aboutWindow.on('closed', () => {
      aboutWindow.destroy()
    })

    return aboutWindow
  }
}
