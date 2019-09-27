const fs = require('fs')

module.exports = {
  getFilesFromPath: (path) => {
    return fs.readdirSync(path)
  }
}
