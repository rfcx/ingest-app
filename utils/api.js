const axios = require('axios')
const fileStreamAxios = axios.create({
  adapter: require('./axios-http-adapter').default
})
const platform = 'amazon' // || 'google'

const apiUrl = (proEnvironment) => {
  if (proEnvironment) {
    return platform === 'amazon' ? 'https://ingest.rfcx.org' : 'https://us-central1-rfcx-ingest-257610.cloudfunctions.net/api'
  }
  return platform === 'amazon' ? 'https://staging-ingest.rfcx.org' : 'https://us-central1-rfcx-ingest-dev.cloudfunctions.net/api'
  // return 'http://192.168.154.144:3030' // return 'http://localhost:3030'
}

const uploadFile = (env, fileName, filePath, fileExt, streamId, timestamp, idToken, progressCallback) => {
  console.log(`path: ${filePath} ext: ${fileExt}`)
  return requestUploadUrl(env, fileName, streamId, timestamp, idToken).then((data) => {
    return performUpload(data.url, filePath, fileExt, progressCallback).then(() => {
      console.log('uploadId', data.uploadId)
      return Promise.resolve(data.uploadId)
    }).catch(error => {
      console.error(error)
      console.log(error.response)
      throw error
    })
  })
}

// Part 0: Create stream
const createStream = (env, streamName, siteGuid, visibility, idToken) => {
  console.log('creating stream api:', streamName, 'site:', siteGuid)
  return axios.post(apiUrl(env) + '/streams', { name: streamName, site: siteGuid, visibility: visibility }, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      const streamId = response.data.id
      return streamId
    }).catch(error => {
      console.log('error response', error.response)
      throw error.response
    })
}

// Part 1: Get signed url

const requestUploadUrl = (env, originalFilename, streamId, timestamp, idToken) => {
  // Make a request for a user with a given ID
  const params = { filename: originalFilename, stream: streamId, timestamp: timestamp }
  console.log('requestUploadUrl with params', params)
  return axios.post(apiUrl(env) + '/uploads', params, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      const url = response.data.url
      const uploadId = response.data.uploadId
      console.log('uploadId = ' + uploadId)
      return { url, uploadId }
    })
}

// Part 2: Upload

const fs = require('fs')

function performUpload (signedUrl, filePath, fileExt, progressCallback) {
  var headers = {
    'Content-Type': `audio/${fileExt}`
  }
  if (platform === 'amazon') {
    // S3 doesn't allow chunked uploads, so setting the Content-Length is required
    const fileSize = fs.statSync(filePath).size
    headers['Content-Length'] = fileSize
  }
  const readStream = fs.createReadStream(filePath)
  const options = {
    headers: headers,
    maxContentLength: 209715200,
    onUploadProgress: function (progressEvent) {
      const progress = parseInt(Math.round((progressEvent.loaded * 100) / progressEvent.total))
      progressCallback(progress)
    }
  }
  return fileStreamAxios.put(signedUrl, readStream, options)
}

// Part 3: Get ingest status

const checkStatus = (env, uploadId, idToken) => {
  return axios.get(apiUrl(env) + '/uploads/' + uploadId, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      const status = response.data.status
      const failureMessage = response.data.failureMessage
      return { status: status, failureMessage: failureMessage }
    }).catch(error => {
      console.log('error', error.response)
      throw error.response
    })
}

const renameStream = (env, streamId, streamName, streamSite, idToken) => {
  return axios.post(apiUrl(env) + `/streams/${streamId}`, { name: streamName, site: streamSite }, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    }).catch(error => {
      console.log('error', error.response)
      throw error.response
    })
}

const touchApi = (env, idToken) => {
  return axios.get(apiUrl(env) + `/users/touchapi`, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    })
}

const sendInviteCode = (env, attrs, idToken) => {
  let data = {
    code: attrs.code
  }
  if (attrs.acceptTerms) {
    data.accept_terms = !!attrs.acceptTerms
  }
  return axios.post(apiUrl(env) + `/users/code`, data, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    }).catch(error => {
      console.log('error', error.response)
      throw error.response
    })
}

const sendAcceptTerms = (env, idToken) => {
  return axios.post(apiUrl(env) + `/users/accept-terms`, { }, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    }).catch(error => {
      console.log('error', error.response)
      throw error.response
    })
}

const getUserSites = (env, idToken) => {
  return axios.get(apiUrl(env) + `/users/sites?`, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    })
}

const getExistingStreams = (env, idToken) => {
  return axios.get(apiUrl(env) + `/streams`, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    }).catch(error => {
      console.log('error', error.response)
      throw error.response
    })
}

export default {
  createStream,
  uploadFile,
  checkStatus,
  renameStream,
  touchApi,
  sendInviteCode,
  sendAcceptTerms,
  getUserSites,
  getExistingStreams
}
