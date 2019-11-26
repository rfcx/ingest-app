const jwtDecode = require('jwt-decode')
const request = require('request')
const url = require('url')
const envVariables = require('../../../env')
const keytar = require('keytar')
const os = require('os')

const { apiIdentifier, auth0Domain, clientId } = envVariables

const redirectUri = `file:///callback`

const keytarAccount = os.userInfo().username

let accessToken = null
let profile = null
let refreshToken = null

async function getAccessToken () {
  return new Promise(async (resolve, reject) => {
    const access = await keytar.getPassword('ingest-app-access-token', keytarAccount)
    if (!access) return reject(new Error('no access token available'))
    resolve(access)
  })
}

async function getIdToken () {
  return new Promise(async (resolve, reject) => {
    const idToken = await keytar.getPassword('ingest-app-id-token', keytarAccount)
    if (!idToken) return reject(new Error('no id token available'))
    resolve(idToken)
  })
}

function getAuthenticationURL () {
  return (
    `https://${auth0Domain}/authorize?audience=${apiIdentifier}&scope=openid profile offline_access&response_type=code&` +
    `client_id=${clientId}&redirect_uri=${redirectUri}`
  )
}

async function refreshTokens () {
  return new Promise(async (resolve, reject) => {
    const refreshToken = await keytar.getPassword('ingest-app-refresh-token', keytarAccount)
    if (!refreshToken) return reject(new Error('no refresh token available'))

    const refreshOptions = {
      method: 'POST',
      url: `https://${auth0Domain}/oauth/token`,
      headers: { 'content-type': 'application/json' },
      body: {
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refreshToken
      },
      json: true
    }

    request(refreshOptions, function (error, response, body) {
      if (error) {
        logout()
        return reject(new Error(error))
      }
      parseTokens(body)
      resolve()
    })
  })
}

function loadTokens (callbackURL) {
  return new Promise((resolve, reject) => {
    const urlParts = url.parse(callbackURL, true)
    const query = urlParts.query

    const exchangeOptions = {
      grant_type: 'authorization_code',
      client_id: clientId,
      code: query.code,
      redirect_uri: redirectUri
    }

    const options = {
      method: 'POST',
      url: `https://${auth0Domain}/oauth/token`,
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(exchangeOptions)
    }

    request(options, (error, resp, body) => {
      if (error) {
        logout()
        return reject(error)
      }

      const responseBody = JSON.parse(body)
      parseTokens(responseBody)
      refreshToken = responseBody.refresh_token
      keytar.setPassword('ingest-app-refresh-token', keytarAccount, refreshToken)
      resolve()
    })
  })
}

function parseTokens (responseBody) {
  accessToken = responseBody.access_token
  keytar.setPassword('ingest-app-access-token', keytarAccount, accessToken)
  profile = jwtDecode(responseBody.id_token)
  keytar.setPassword('ingest-app-id-token', keytarAccount, responseBody.id_token)
  if (profile && profile.given_name) {
    global.firstname = profile.given_name
  }
  if (profile && profile['https://rfcx.org/app_metadata']) {
    global.accessibleSites = profile['https://rfcx.org/app_metadata'].accessibleSites
    global.defaultSite = profile['https://rfcx.org/app_metadata'].defaultSite
  }
}

async function logout () {
  await keytar.deletePassword('ingest-app-refresh-token', keytarAccount)
  await keytar.deletePassword('ingest-app-access-token', keytarAccount)
  await keytar.deletePassword('ingest-app-id-token', keytarAccount)
  accessToken = null
  profile = null
  refreshToken = null
}

export default {
  getAccessToken,
  getAuthenticationURL,
  getIdToken,
  loadTokens,
  logout,
  refreshTokens
}
