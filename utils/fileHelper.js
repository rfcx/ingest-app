const fs = require('fs')
const path = require('path')
const cryptoJS = require('crypto-js')

module.exports = {
  getFilesFromDirectoryPath: (directoryPath) => {
    return fs.readdirSync(directoryPath)
  },
  readFile: (directoryPath, fileName) => {
    return fs.readFileSync(path.join(directoryPath, fileName))
  },
  getMD5Hash: (directoryPath, fileName) => {
    const fileData = fs.readFileSync(path.join(directoryPath, fileName))
    return cryptoJS.MD5(fileData).toString()
  },
  getFileName: (fileName) => {
    const ext = '.' + fileName.split('.').pop() // FIXME: call getExtension function
    return fileName.replace(ext, '')
  },
  getExtension: (fileName) => {
    return fileName.split('.').pop()
  }
}
