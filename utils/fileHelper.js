const fs = require('fs')
const path = require('path')
const cryptoJS = require('crypto-js')

function getFilePath (directoryPath, fileName) {
  return path.join(directoryPath, fileName)
}

function isFile (filePath) {
  return fs.lstatSync(filePath).isFile()
}

function readFile (filePath) {
  return fs.readFileSync(filePath)
}

function getExtension (fileName) {
  return fileName.split('.').pop()
}

module.exports = {
  getFilesFromDirectoryPath: (directoryPath) => {
    if (fs.existsSync(directoryPath)) {
      return fs.readdirSync(directoryPath)
    }
    return undefined
  },
  readFile: (filePath) => {
    return readFile(filePath)
  },
  getMD5Hash: (filePath) => {
    if (!isFile(filePath)) return ''
    const fileData = readFile(filePath)
    return cryptoJS.MD5(fileData).toString()
  },
  getFilePath (directoryPath, fileName) {
    return getFilePath(directoryPath, fileName)
  },
  getFileNameFromFilePath (filePath) {
    return path.parse(filePath).base
  },
  getFileName: (fileName) => {
    const ext = '.' + getExtension(fileName) // FIXME: call getExtension function
    return fileName.replace(ext, '')
  },
  getExtension: (fileName) => {
    return getExtension(fileName)
  },
  getFileSize: (filePath) => {
    const stats = fs.statSync(filePath)
    return stats.size
  },
  isSupportedFileExtension: (fileExtension) => {
    return fileExtension === 'wav' || fileExtension === 'mp3' || fileExtension === 'opus'
  }
}
