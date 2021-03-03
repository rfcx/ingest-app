import File from '../src/renderer/store/models/File'
import fileHelper from './fileHelper'
import Analytics from 'electron-ga'
import settings from 'electron-settings'

const axios = require('axios')
const fileStreamAxios = axios.create({
  adapter: require('./axios-http-adapter').default
})
const httpClient = axios.create()
httpClient.defaults.timeout = 30000
const { remote } = window.require('electron')
const env = require('../env.json')

const apiUrl = (proEnvironment) => {
  const url = remote.getGlobal('ingestServicelUrl')
  if (url) { return url } // local url provided
  return proEnvironment ? env.ingestApi : env.staging.ingestApi
}

const explorerWebUrl = (isProd, streamId = null) => {
  let baseUrl = isProd ? env.explorerUrl : env.staging.explorerUrl
  let query = streamId ? `?stream=${streamId}` : ''
  return baseUrl + query
}

const arbimonWebUrl = (isProd, streamId = null) => {
  let baseUrl = isProd ? env.arbimonUrl : env.staging.arbimonUrl
  let query = streamId ? `/site/${streamId}` : ''
  return baseUrl + query
}

const uploadFile = async (environment, fileId, fileName, filePath, fileExt, streamId, timestamp, idToken, progressCallback) => {
  const now = Date.now()
  const analytics = new Analytics(env.analytics.id)
  console.log(`===> upload file ${fileName}`)
  let isConverted = false
  let uploadFileName = fileName
  let uploadFilePath = filePath
  let uploadFileExt = fileExt
  if (fileExt === 'wav') {
    try {
      File.update({ where: fileId,
        data: {state: 'converting', uploaded: false}
      })
      uploadFilePath = (await fileHelper.convert(filePath, remote.app.getPath('temp'), streamId)).path
      uploadFileExt = 'flac'
      uploadFileName = fileHelper.getFileNameFromFilePath(uploadFilePath)
      isConverted = true
      console.log('update upload path', uploadFilePath, uploadFileExt, uploadFileName)
    } catch (error) {
      console.log('error', error)
    }
  }
  return requestUploadUrl(environment, uploadFileName, uploadFilePath, streamId, timestamp, idToken)
    .then(async (data) => {
      const getUploadIdTime = Date.now() - now
      const analyticsEventObj = { 'ec': env.analytics.category.time, 'ea': env.analytics.action.getUploadId, 'el': fileName, 'ev': getUploadIdTime }
      await analytics.send('event', analyticsEventObj)
      File.update({ where: fileId,
        data: {state: 'uploading', uploadId: data.uploadId, progress: 0, uploaded: false}
      })
      return performUpload(data.url, data.uploadId, uploadFilePath, uploadFileExt, progressCallback).then(async () => {
        const uploadTime = Date.now() - now
        const analyticsEventObj = { 'ec': env.analytics.category.time, 'ea': env.analytics.action.upload, 'el': fileName, 'ev': uploadTime }
        await analytics.send('event', analyticsEventObj)
        if (isConverted) {
          fileHelper.remove(uploadFilePath)
        }
        return data.uploadId
      })
    })
}

// Part 0: Create stream
const createStream = (env, streamName, latitude, longitude, visibility, deviceId, idToken) => {
  console.log('creating stream api:', streamName)
  return httpClient.post(apiUrl(env) + '/streams', { name: streamName, latitude: latitude, longitude: longitude, is_public: visibility, device_id: deviceId }, { headers: { 'Authorization': 'Bearer ' + idToken } })
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
  console.log('===> requestUploadUrl for', originalFilename)
  const sha1 = fileHelper.getCheckSum(filePath)
  const params = { filename: originalFilename, checksum: sha1, stream: streamId, timestamp: timestamp }
  return httpClient.post(apiUrl(env) + '/uploads', params, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(response => {
      const url = response.data.url
      const uploadId = response.data.uploadId
      return { url, uploadId }
    }).catch(error => {
      if (error.response.data) { throw new Error(error.response.data.message) }
      throw error.response
    })
}

// Part 2: Upload

const fs = require('fs')

function performUpload (signedUrl, signId, filePath, fileExt, progressCallback) {
  console.log(`===> performUpload to upload file ${signId}`)
  var headers = {
    'Content-Type': `audio/${fileExt}`
  }
  // S3 doesn't allow chunked uploads, so setting the Content-Length is required
  const fileSize = fileHelper.getFileSize(filePath)
  headers['Content-Length'] = fileSize
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

const getUserSites = (env, idToken) => {
  return httpClient.get(apiUrl(env) + `/streams`, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(function (response) {
      return response.data
    }).catch(error => {
      console.log('error', error.response)
      throw error.response
    })
}

const getDeploymentInfo = (deploymentId, idToken) => {
  const isProd = settings.get('settings.production_env')
  return httpClient.get(apiUrl(isProd) + `/deployments/${deploymentId}`, { headers: { 'Authorization': 'Bearer ' + idToken } })
    .then(response => {
      return response.data
    }).catch(error => {
      console.log('error', error)
      throw error.response
    })
}

export default {
  explorerWebUrl,
  arbimonWebUrl,
  createStream,
  updateStream,
  uploadFile,
  checkStatus,
  renameStream,
  deleteStream,
  getUserSites,
  getDeploymentInfo
}
