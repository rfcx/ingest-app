const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

module.exports = {
  setDefault: () => {
    db.defaults({ streams: [], user: {} }).write()
  },
  setUser: (key, value) => {
    db.set(key, value).write()
  },
  getStreams: () => {
    return db.get('streams').value()
  },
  addNewStream: (data) => {
    db.get('streams').push(data).write()
  }
}
