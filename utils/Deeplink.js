export default class Deeplink {
  fullUrl = ''
  command = ''
  param = ''

  constructor (link) {
    try {
      const a = this.parse(link)
      this.fullUrl = link
      this.command = a.command
      this.param = a.params
    } catch (e) {
      console.log('parse deeplink error', e)
    }
  }

  get isAuth () {
    return this.command === 'auth'
  }

  // Helper

  parse (link) {
    if (!link.startsWith('rfcx-uploader://')) return Promise.reject(new Error('deeplink is not valid'))
    const paths = link.replace('rfcx-uploader://', '').split('/')
    const command = paths[0]
    const params = paths[1]
    return {command, params}
  }
}
