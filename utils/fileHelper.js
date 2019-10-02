const fs = require('fs')

module.exports = {
  getFilesFromPath: (path) => {
    return fs.readdirSync(path)
  },
  getFileName: (fileName) => {
    const ext = '.' + fileName.split('.').pop() // FIXME: call getExtension function
    return fileName.replace(ext, '')
  },
  getExtension: (fileName) => {
    return fileName.split('.').pop()
  }
}
