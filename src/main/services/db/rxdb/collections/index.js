const fs = require('fs')
const util = require('util')
const readDir = util.promisify(fs.readdir)

export const getSchemas = function () {
  return readDir(__dirname)
    .then(files => files.filter(f => f !== 'index.js'))
    .then(files => files.reduce((acc, file) => { acc[file.replace('.js', '')] = require(`./${file}`); return acc }, {}))
}
