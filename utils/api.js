const axios = require('axios')
const fileStreamAxios = axios.create({
  adapter: require('./axios-http-adapter').default
})
const platform = 'google' // || 'amazon'

const apiUrl = (proEnvironment) => {
  if (proEnvironment) {
    return platform === 'amazon' ? 'https://ingest-service.rfcx.org' : 'https://us-central1-rfcx-ingest-257610.cloudfunctions.net/api'
  }
  return platform === 'amazon' ? 'https://staging-ingest.rfcx.org' : 'https://us-central1-rfcx-ingest-dev.cloudfunctions.net/api'
  // local staging for s3 'http://localhost:3030'
}

const uploadFile = (env, fileName, filePath, fileExt, streamId, timestamp, idToken, progressCallback) => {
  console.log(`path: ${filePath} ext: ${fileExt}`)
  return requestUploadUrl(env, fileName, streamId, timestamp, idToken).then((data) => {
    return (platform === 'amazon' ? uploadToS3(data.url, filePath, fileExt, progressCallback) : uploadToGoogleCloud(data.url, filePath, fileExt, progressCallback))
      .then(() => {
        console.log('uploadId', data.uploadId)
        return Promise.resolve(data.uploadId)
      })
      .catch((error) => {
        return Promise.reject(error)
      })
  })
}

// Part 0: Create stream
const createStream = (env, streamName, siteGuid, idToken) => {
  console.log('creating stream api:', streamName, 'site:', siteGuid)
  return axios.post(apiUrl(env) + '/streams', { name: streamName, site: siteGuid }, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      const streamId = response.data.id
      return streamId
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

function readFileAsync (path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, function (error, result) {
      if (error || !result) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

async function uploadToS3 (signedUrl, filePath, fileExt, progressCallback) {
  try {
    const contents = await readFileAsync(filePath)
    if (contents) {
      return axios.put(signedUrl, contents, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    }
  } catch (error) {
    console.log(error)
  }
}

const uploadToGoogleCloud = (signedUrl, filePath, fileExt, progressCallback) => {
  const readStream = fs.createReadStream(filePath)
  const options = {
    headers: {
      'Content-Type': `audio/${fileExt}`
    },
    maxContentLength: 209715200,
    onUploadProgress: function (progressEvent) {
      const progress = parseInt(Math.round((progressEvent.loaded * 100) / progressEvent.total))
      console.log('onUploadProgress', progress)
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
    })
}

const renameStream = (env, streamId, streamName, streamSite, idToken) => {
  return axios.post(apiUrl(env) + `/streams/${streamId}`, { name: streamName, site: streamSite }, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    })
}

const touchApi = (env, idToken) => {
  return axios.get(env + `/users/touchapi`, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    })
}

const sendInviteCode = (env, code, idToken) => {
  return axios.post(env + `/users/code`, { code: code }, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    })
}

export default {
  createStream,
  uploadFile,
  checkStatus,
  renameStream,
  touchApi,
  sendInviteCode
}
