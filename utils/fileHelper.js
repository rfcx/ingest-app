const fs = require('fs')
const path = require('path')
const cryptoJS = require('crypto-js')

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
  return fileName.split('.').pop()
}

const getFilesFromDirectoryPath = (directoryPath) => {
  if (fs.existsSync(directoryPath)) {
    return fs.readdirSync(directoryPath)
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
  const ext = '.' + getExtension(fileName) // FIXME: call getExtension function
  return fileName.replace(ext, '')
}

const getFileSize = (filePath) => {
  const stats = fs.statSync(filePath)
  return stats.size
}

const isSupportedFileExtension = (fileExtension) => {
  return fileExtension === 'wav' || fileExtension === 'opus' || fileExtension === 'flac'
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
  isSupportedFileExtension,
  isFolder,
  getCheckSum
}
