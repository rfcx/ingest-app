const fs = require('fs')
const path = require('path')
const cryptoJS = require('crypto-js')
const { getAudioDurationInSeconds } = require('get-audio-duration')

const getFilePath = (directoryPath, fileName) => {
  return path.join(directoryPath, fileName)
}

const isExist = (path) => {
  return fs.existsSync(path)
}

const isFile = (filePath) => {
  return fs.lstatSync(filePath).isFile()
}

const isFolder = (filePath) => {
  return fs.lstatSync(filePath).isDirectory()
}

const readFile = (filePath) => {
  return fs.readFileSync(filePath)
}

const getExtension = (fileName) => {
  return fileName.split('.').pop().toLowerCase()
}

const getFilesFromDirectoryPath = (directoryPath) => {
  if (fs.existsSync(directoryPath)) {
    return fs.readdirSync(directoryPath).filter(item => !(/(^|\/)\.[^/.]/g).test(item))
  }
  return undefined
}

const getMD5Hash = (filePath) => {
  if (!isFile(filePath)) return ''
  const fileData = readFile(filePath)
  let fileWordArr = cryptoJS.lib.WordArray.create(fileData)
  let sha1Hash = cryptoJS.SHA1(fileWordArr)
  return {
    hash: cryptoJS.MD5(fileData).toString(),
    sha1: sha1Hash.toString()
  }
}

const getCheckSum = (filePath) => {
  const fileData = readFile(filePath)
  let fileWordArr = cryptoJS.lib.WordArray.create(fileData)
  let sha1Hash = cryptoJS.SHA1(fileWordArr)
  return sha1Hash.toString()
}

const getFileNameFromFilePath = (filePath) => {
  return path.parse(filePath).base
}

const getFileName = (fileName) => {
  const ext = '.' + getExtension(fileName)
  return fileName.replace(ext, '')
}

const getFileSize = (filePath) => {
  const stats = fs.statSync(filePath)
  return stats.size
}

const getFileDuration = (filePath) => {
  return getAudioDurationInSeconds(filePath).then(duration => {
    return Promise.resolve(duration)
  }).catch(error => {
    console.error(error)
    return Promise.resolve(-2)
  })
}

const isSupportedFileExtension = (fileExtension) => {
  let extension = fileExtension.toLowerCase()
  return extension === 'wav' || extension === 'opus' || extension === 'flac'
}

export default {
  getFilesFromDirectoryPath,
  readFile,
  isExist,
  getMD5Hash,
  getFilePath,
  getFileNameFromFilePath,
  getFileName,
  getExtension,
  getFileSize,
  getFileDuration,
  isSupportedFileExtension,
  isFolder,
  getCheckSum
}
