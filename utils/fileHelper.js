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
    return fs.readdirSync(directoryPath)
  },
  readFile: (directoryPath, fileName) => {
    const filePath = getFilePath(directoryPath, fileName)
    return readFile(filePath)
  },
  getMD5Hash: (directoryPath, fileName) => {
    const filePath = getFilePath(directoryPath, fileName)
    if (!isFile(filePath)) return ''
    const fileData = readFile(filePath)
    return cryptoJS.MD5(fileData).toString()
  },
  getFileName: (fileName) => {
    const ext = '.' + getExtension(fileName) // FIXME: call getExtension function
    return fileName.replace(ext, '')
  },
  getExtension: (fileName) => {
    return getExtension(fileName)
  }
}
