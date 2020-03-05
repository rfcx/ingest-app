
import apiService from './api-service'
const request = require('request')

async function getUserSites (idToken) {
  console.log('getUserSites')
  return new Promise(async (resolve, reject) => {
    const req = {
      method: 'GET',
      url: `${apiService.getAPIUrl()}/users/sites`,
      headers: {
        'content-type': 'application/json',
        'Authorization': idToken
      },
      json: true
    }

    request(req, async (error, response, body) => {
      if (error) {
        // return reject(new Error(error))
        return resolve([])
      }
      resolve(Array.isArray(body) ? body : [])
    })
  })
}

export default {
  getUserSites
}
