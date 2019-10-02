// https://jsonplaceholder.typicode.com/posts

const axios = require('axios')

module.exports = {
  uploadFile: (progressCallback, successCallback, failureCallback) => {
    axios.post('https://jsonplaceholder.typicode.com/posts', {}, {
      onUploadProgress: function (progressEvent) {
        const progress = parseInt(Math.round((progressEvent.loaded * 100) / progressEvent.total))
        progressCallback(progress)
      }
    }).then(function (response) {
      successCallback()
    }).catch(function (error) {
      failureCallback(error)
    })
  }
}
