import File from '../src/renderer/store/models/File'
import fileHelper from './fileHelper'
const axios = require('axios')
const fileStreamAxios = axios.create({
  adapter: require('./axios-http-adapter').default
})
const httpClient = axios.create()
httpClient.defaults.timeout = 30000
const platform = 'amazon' // || 'google'

const apiUrl = (proEnvironment) => {
  if (proEnvironment) {
    return platform === 'amazon' ? 'https://ingest.rfcx.org' : 'https://us-central1-rfcx-ingest-257610.cloudfunctions.net/api'
  }
  return platform === 'amazon' ? 'https://staging-ingest.rfcx.org' : 'https://us-central1-rfcx-ingest-dev.cloudfunctions.net/api'
  // return 'https://192.168.154.144:3030' // return 'https://localhost:3030'
}

const explorerWebUrl = (isProd, streamId = null) => {
  let baseUrl = isProd ? 'https://explorer.rfcx.org/' : 'https://staging-explorer.rfcx.org/'
  let query = streamId ? `?stream=${streamId}` : ''
  return baseUrl + query
}

const uploadFile = (env, fileId, fileName, filePath, fileExt, streamId, timestamp, fileSize, idToken, progressCallback) => {
  const now = Date.now()
  console.log(`===> upload file ${fileName}`)
  return requestUploadUrl(env, fileName, filePath, streamId, timestamp, idToken)
    .then((data) => {
      File.update({ where: fileId,
        data: {state: 'uploading', uploadId: data.uploadId, progress: 0, uploaded: false, uploadedTime: now}
      })
      return performUpload(data.url, data.uploadId, filePath, fileExt, fileSize, progressCallback).then(() => data.uploadId)
    })
}

// Part 0: Create stream
const createStream = (env, streamName, latitude, longitude, visibility, idToken) => {
  console.log('creating stream api:', streamName)
  return httpClient.post(apiUrl(env) + '/streams', { name: streamName, latitude: latitude, longitude: longitude, is_public: visibility }, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      const streamId = response.data.id
      return streamId
    }).catch(error => {
      console.log('error response', error.response)
      throw error.response
    })
}

// Part 1: Get signed url

const requestUploadUrl = (env, originalFilename, filePath, streamId, timestamp, idToken) => {
  // Make a request for a user with a given ID
  const sha1 = fileHelper.getCheckSum(filePath)
  const params = { filename: originalFilename, checksum: sha1, stream: streamId, timestamp: timestamp }
  console.log('===> requestUploadUrl with params', params)
  return httpClient.post(apiUrl(env) + '/uploads', params, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      const url = response.data.url
      const uploadId = response.data.uploadId
      console.log('===> requestUploadUrl for', originalFilename, uploadId)
      return { url, uploadId }
    })
}

// Part 2: Upload

const fs = require('fs')

function performUpload (signedUrl, signId, filePath, fileExt, fileSize, progressCallback) {
  console.log(`===> performUpload to upload file ${signId}`)
  var headers = {
    'Content-Type': `audio/${fileExt}`
  }
  if (platform === 'amazon') {
    // S3 doesn't allow chunked uploads, so setting the Content-Length is required
    // const fileSize = fs.statSync(filePath).size
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
  return httpClient.get(apiUrl(env) + '/uploads/' + uploadId, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      const status = response.data.status
      const failureMessage = response.data.failureMessage
      return { status: status, failureMessage: failureMessage }
    }).catch(error => {
      console.log('error', error, error.response)
      throw error
    })
}

const updateStream = (env, streamId, opts, idToken) => {
  return httpClient.patch(apiUrl(env) + `/streams/${streamId}`, opts, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    }).catch(error => {
      console.log('error', error.response)
      throw error.response
    })
}

const renameStream = (env, streamId, streamName, streamSite, idToken) => {
  return httpClient.patch(apiUrl(env) + `/streams/${streamId}`, { name: streamName, site: streamSite }, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    }).catch(error => {
      console.log('error', error.response)
      throw error.response
    })
}

const deleteStream = (env, streamId, idToken) => {
  return httpClient.delete(apiUrl(env) + `/streams/${streamId}`, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    }).catch(error => {
      console.log('error', error.response)
      throw error.response
    })
}

const moveToTrashStream = (env, streamId, idToken) => {
  return httpClient.post(apiUrl(env) + `/streams/${streamId}/move-to-trash`, {}, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    }).catch(error => {
      console.log('error', error.response)
      throw error.response
    })
}

const touchApi = (env, idToken) => {
  return httpClient.get(apiUrl(env) + `/users/touchapi`, { headers: { 'Authorization': 'Bearer ' + idToken } })
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
  return httpClient.post(apiUrl(env) + `/users/code`, data, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    }).catch(error => {
      console.log('error', error.response)
      throw error.response
    })
}

const getUserSites = (env, idToken) => {
  return httpClient.get(apiUrl(env) + `/users/sites?`, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    })
}

const getExistingStreams = (env, idToken) => {
  return httpClient.get(apiUrl(env) + `/streams`, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    }).catch(error => {
      console.log('error', error.response)
      throw error.response
    })
}

export default {
  explorerWebUrl,
  createStream,
  updateStream,
  uploadFile,
  checkStatus,
  renameStream,
  deleteStream,
  moveToTrashStream,
  touchApi,
  sendInviteCode,
  getUserSites,
  getExistingStreams
}
