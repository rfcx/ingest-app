import { app } from 'electron'
const ua = require('universal-analytics')
const uuid = require('uuid/v4')
const { JSONStorage } = require('node-localstorage')
const nodeStorage = new JSONStorage(app.getPath('userData'))

// Retrieve the userid value, and if it's not there, assign it a new uuid.
const userId = nodeStorage.getItem('userid') || uuid()

// (re)save the userid, so it persists for the next app session.
nodeStorage.setItem('userid', userId)

const usr = ua('UA-XXXXXXXX-X', userId)

function openLandingPage () {
  usr.pageview('/', 'landing-page').send()
}

// function trackEvent (category, action, label, value) {
//   usr
//     .event({
//       ec: category,
//       ea: action,
//       el: label,
//       ev: value
//     })
//     .send()
// }

console.log('usr', usr, 'userId', userId, 'nodeStorage', nodeStorage)

// const { getGlobal } = require('electron').remote
// global.trackEvent = trackEvent -> to renderer process

export default { openLandingPage }
