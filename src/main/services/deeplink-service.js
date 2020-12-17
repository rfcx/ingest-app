import { app } from 'electron'
import Deeplink from '../../../utils/Deeplink'
import authService from '../services/auth-service'

export default {
  intialize: () => {
    app.setAsDefaultProtocolClient('rfcx-uploader')
  },
  addOpenURLListener: (authHandler) => {
    app.on('open-url', function (event, link) {
      event.preventDefault()
      let deeplink = new Deeplink(link)
      console.log('open-url', link, deeplink)
      if (deeplink.isAuth) { // TODO: check if already logged in
        authService.loadTokens(deeplink.param).then(authHandler)
      }
    })
  }
}
