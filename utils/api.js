// https://jsonplaceholder.typicode.com/posts

const axios = require('axios')

module.exports = {
  uploadFile: (progressCallback, successCallback, failureCallback) => {
    axios.post('https://jsonplaceholder.typicode.com/posts', {}, {
      onUploadProgress: function (progressEvent) {
        // callback
        const progress = parseInt(Math.round((progressEvent.loaded * 100) / progressEvent.total))
        progressCallback(progress)
        console.log(parseInt(Math.round((progressEvent.loaded * 100) / progressEvent.total)))
      }
    }).then(function (response) {
      console.log('request success')
      successCallback()
      // callback
      console.log(response)
    }).catch(function (error) {
      console.log('request error')
      // callback
      failureCallback(error)
      console.log(error)
    })
  }
}
