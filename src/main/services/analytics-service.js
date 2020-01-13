import { app } from 'electron'
const ua = require('universal-analytics')
const uuid = require('uuid/v4')
const { JSONStorage } = require('node-localstorage')
const nodeStorage = new JSONStorage(app.getPath('userData'))

// Retrieve the userid value, and if it's not there, assign it a new uuid.
const userId = nodeStorage.getItem('userid') || uuid()

// (re)save the userid, so it persists for the next app session.
nodeStorage.setItem('userid', userId)

const visitor = ua('156018231', userId)

function openLandingPage () {
  console.log('openLandingPage')
  // usr.pageview('/', 'index.html').send()
}

function sendVersionOfApp () {
  visitor.screenview('Home Screen', 'RFCx', `${process.env.npm_package_version}`).send()
}

// const { getGlobal } = require('electron').remote
// global.trackEvent = trackEvent -> to renderer process

export default {
  openLandingPage,
  sendVersionOfApp
}
