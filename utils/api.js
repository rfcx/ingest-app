const axios = require('axios')
const fileStreamAxios = axios.create({
  adapter: require('./axios-http-adapter').default
})

const apiUrl = (proEnvironment) => {
  if (proEnvironment) return 'https://us-central1-rfcx-ingest-257610.cloudfunctions.net/api'
  return 'https://us-central1-rfcx-ingest-dev.cloudfunctions.net/api'
}

const uploadFile = (env, fileName, filePath, fileExt, streamId, timestamp, progressCallback) => {
  console.log(`path: ${filePath} ext: ${fileExt}`)
  return requestUploadUrl(env, fileName, streamId, timestamp).then((data) => {
    return upload(data.url, filePath, fileExt, progressCallback)
      .then(() => {
        return Promise.resolve(data.uploadId)
      })
      .catch((error) => {
        return Promise.reject(error)
      })
  })
}

// Part 0: Create stream
const createStream = (env, streamName) => {
  console.log('create stream api:', streamName)
  return axios.post(apiUrl(env) + '/streams', { name: streamName })
    .then(function (response) {
      const streamId = response.data.id
      return streamId
    })
}

// Part 1: Get signed url

const requestUploadUrl = (env, originalFilename, streamId, timestamp) => {
  // Make a request for a user with a given ID
  const params = { filename: originalFilename, stream: streamId, timestamp: timestamp }
  console.log('requestUploadUrl with params', params)
  return axios.post(apiUrl(env) + '/uploads', params)
    .then(function (response) {
      const url = response.data.url
      const uploadId = response.data.uploadId
      console.log('uploadId = ' + uploadId)
      return { url, uploadId }
    })
}

// Part 2: Upload

const fs = require('fs')

const upload = (signedUrl, filePath, fileExt, progressCallback) => {
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

const checkStatus = (env, uploadId) => {
  return axios.get(apiUrl(env) + '/uploads/' + uploadId)
    .then(function (response) {
      const status = response.data.status
      const failureMessage = response.data.failureMessage
      return { status: status, failureMessage: failureMessage }
    })
}

export default {
  createStream,
  uploadFile,
  checkStatus
}
