// https://jsonplaceholder.typicode.com/posts

const axios = require('axios')
const fileStreamAxios = axios.create({
  adapter: require('./axios-http-adapter').default
})

const apiUrl = 'https://us-central1-rfcx-ingest-dev.cloudfunctions.net/api'

const uploadFile = (filePath, progressCallback) => {
  return requestUploadUrl().then((url) => {
    return upload(url, filePath, progressCallback)
  })
}

// Part 1: Get signed url

const requestUploadUrl = () => {
  // Make a request for a user with a given ID
  return axios.post(apiUrl + '/uploads')
    .then(function (response) {
      const url = response.data.url
      const uploadId = response.data.uploadId
      console.log('uploadId = ' + uploadId)
      return url
    })
}

// Part 2: Upload

const fs = require('fs')

const upload = (signedUrl, filePath, progressCallback) => {
  const readStream = fs.createReadStream(filePath)
  const options = {
    headers: {
      'Content-Type': 'audio/wav'
    },
    onUploadProgress: function (progressEvent) {
      const progress = parseInt(Math.round((progressEvent.loaded * 100) / progressEvent.total))
      console.log('onUploadProgress', progress)
      progressCallback(progress)
    }
  }
  return fileStreamAxios.put(signedUrl, readStream, options)
}

export default {
  uploadFile
}
