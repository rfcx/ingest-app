import { BrowserWindow } from 'electron'
import menu from '../Menu/main-menu'

export default {
  createAuthWindow () {
    console.log('createAuthWindow')
    let isDarkMode = true
    menu.createMenu()
    const win = new BrowserWindow({
      width: 615,
      height: 650,
      webPreferences: {
        nodeIntegration: false
      }
    })
    const {
      session: { webRequest }
    } = win.webContents
    win.loadURL(authService.getAuthenticationURL(), { userAgent: 'Chrome' })
    currentUrl = authService.getAuthenticationURL()
    webRequest.onBeforeRequest(filter, async ({ url }) => {
      console.log('authWindow onBeforeRequest')
      await authService.loadTokens(url)
      index.createWindow(false)
      global.firstLogIn = true
      await destroyAuthWin()
    })
    // win.webContents.once('dom-ready', () => win.webContents.openDevTools())
    win.webContents.on('did-finish-load', () => {
      let code = `if (document.getElementById('btn-login-passwordless'))
                  { document.getElementById('btn-login-passwordless').style.display = 'none' }
                  let title = document.getElementsByTagName('h3')[0]
                  if (title) { title.textContent= 'Rainforest Connection' }
                  if (title && ${isDarkMode}) { title.style.color = "#fff" }
                  let titleSignUp = document.getElementsByTagName('h3')[1]
                  if (titleSignUp) { titleSignUp.textContent= 'Rainforest Connection' }
                  if (titleSignUp && ${isDarkMode}) { titleSignUp.style.color = "#fff" }
                  let head = document.getElementsByTagName('head')[0]
                  let link = document.createElement('link')
                  link.rel = 'stylesheet'
                  head.appendChild(link)
                  link.href = 'https://fonts.googleapis.com/css?family=Lato:300,400,700'
                  let html = document.getElementsByTagName('html')[0]
                  if (html && ${isDarkMode})
                  { html.style.backgroundColor = '#131525' }
                  let body = document.getElementsByTagName('body')[0]
                  if (body && ${isDarkMode})
                  { body.style.backgroundColor = '#131525'; body.style.setProperty('font-family', "'Lato', sans-serif", 'important') }
                  document.querySelectorAll('input').forEach(el => el.style.setProperty('font-family', "'Lato', sans-serif", 'important'))
                  document.querySelectorAll('h3').forEach(el => el.style.setProperty('font-family', "'Lato', sans-serif", 'important'))
                  document.querySelectorAll('button').forEach(el => el.style.setProperty('font-family', "'Lato', sans-serif", 'important'))`
      win.webContents.executeJavaScript(code)
    })
    win.webContents.on('did-redirect-navigation', (event, url) => {
      if (currentUrl !== url) {
        if (url.includes('https://rfcx.eu.auth0.com/login')) {
          menu.items[0].submenu.items[1].enabled = false
          return
        }
        menu.items[0].submenu.items[1].enabled = true
        createBackButton()
      }
    })
    win.webContents.on('did-frame-finish-load', (event, isMainFrame, frameProcessId, frameRoutingId) => {
      let url = event.sender.getURL()
      if (url.includes('&lp=1&hl=')) {
        createBackButton()
      }
    })
    win.on('closed', () => {
      win = null
      console.log('auth window closed')
    })
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (errorDescription === 'ERR_INTERNET_DISCONNECTED') {
        let code = `body = document.getElementsByTagName('body')[0]
        if (body) {
        let div = document.createElement('div')
        body.appendChild(div)
        div.innerHTML = 'No Internet Connection'
        div.style.fontSize = '20px'; div.style.color = 'grey'; div.style.paddingTop = '100px'; div.style.textAlign = 'center' }`
        win.webContents.executeJavaScript(code)
        let interval = setInterval(() => {
          const checkInternetConnected = require('check-internet-connected')
          const config = {
            timeout: 5000,
            retries: 1,
            domain: 'apple.com'
          }
          checkInternetConnected(config)
            .then(() => {
              console.log('Connection available')
              win.loadURL(authService.getAuthenticationURL(), { userAgent: 'Chrome' })
              currentUrl = authService.getAuthenticationURL()
              clearInterval(interval)
            }).catch((err) => {
              console.log('No connection', err)
            })
        }, 5000)
      }
    })
  }
}
