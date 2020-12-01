import getAudioDurationInSeconds from './fileDurationHelper'
const fs = require('fs')
const path = require('path')
const cryptoJS = require('crypto-js')
const dayInMs = 1000 * 60 * 60 * 24

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
  return getAudioDurationInSeconds(filePath)
}

const isSupportedFileExtension = (fileExtension) => {
  let extension = fileExtension.toLowerCase()
  return extension === 'wav' || extension === 'opus' || extension === 'flac'
}

const isOutdatedFile = (file) => {
  return file.uploadedTime && Date.now() - parseInt(file.uploadedTime) > dayInMs * 30
}

// keep retring for preventing EPREM error (https://stackoverflow.com/questions/39293636/npm-err-error-eperm-operation-not-permitted-rename/45840283)
const rename = (path, newPath, maxRetires) => new Promise((resolve, reject) => {
  fs.rename(path, newPath, e => {
    if (e && (e.code === 'EACCES' || e.code === 'EPERM') && maxRetires > 0) {
      maxRetires--
      return rename(path, newPath, maxRetires).then(resolve).catch(reject)
    } else if (e) {
      reject(e)
    } else {
      resolve(newPath)
    }
  })
})

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
  getCheckSum,
  isOutdatedFile,
  rename
}
