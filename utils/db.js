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
  getSelectedStream: () => {
    return db.get('selectedStream').value()
  },
  addNewStream: (data) => {
    // const id = stream.name + stream.folderPath
    // const data = {id: id, ...stream}
    // console.log('stream => ' + JSON.stringify(stream))
    // console.log('data => ' + JSON.stringify(data))
    db.get('streams').push(data).write()
    console.log(db.has('selectedStream').value())
    if (!db.has('selectedStream').value()) {
      console.log('set selected stream')
      db.set('selectedStream', data).write()
    }
  },
  checkIfDuplicateStream: (streamName, folderPath) => {
    console.log('checkIfDuplicateStream')
    const stream = db.get('streams').find({ id: streamName + folderPath }).value()
    console.log(stream)
    return (stream)
  },
  setSelectedStream: (stream) => {
    db.set('selectedStream', stream).write()
  }
}
