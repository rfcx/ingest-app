// https://jsonplaceholder.typicode.com/posts

const axios = require('axios')
const fileStreamAxios = axios.create({
  adapter: require('./axios-http-adapter').default
})

const apiUrl = 'https://us-central1-rfcx-ingest-dev.cloudfunctions.net/api'

const uploadFile = (fileName, filePath, fileExt, streamId, progressCallback) => {
  console.log(`path: ${filePath} ext: ${fileExt}`)
  return requestUploadUrl(fileName, streamId).then((data) => {
    return upload(data.url, filePath, fileExt, progressCallback)
      .then(() => {
        return Promise.resolve(data.uploadId)
      })
      .catch((error) => {
        return Promise.reject(error)
      })
  })
}

// Part 1: Get signed url

const requestUploadUrl = (originalFilename, streamId) => {
  // Make a request for a user with a given ID
  return axios.post(apiUrl + '/uploads', { filename: originalFilename, stream: streamId })
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
    onUploadProgress: function (progressEvent) {
      const progress = parseInt(Math.round((progressEvent.loaded * 100) / progressEvent.total))
      console.log('onUploadProgress', progress)
      progressCallback(progress)
    }
  }
  return fileStreamAxios.put(signedUrl, readStream, options)
}

// Part 3: Get ingest status

const checkStatus = (uploadId) => {
  return axios.get(apiUrl + '/uploads/' + uploadId)
    .then(function (response) {
      const status = response.data.status
      return status
    })
}

export default {
  uploadFile,
  checkStatus
}
