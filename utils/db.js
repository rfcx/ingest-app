const low = require('lowdb')
const LocalStorage = require('lowdb/adapters/LocalStorage')

const adapter = new LocalStorage('db')
const db = low(adapter)

module.exports = {
  setDefault: () => {
    db.defaults({ streams: [], files: [], user: {} }).write()
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
    // save files
    data.files.forEach((file) => {
      db.get('files').push(file).write()
    })
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
  },
  addFile: (data) => {
    db.get('files').push(data).write()
  }
}
