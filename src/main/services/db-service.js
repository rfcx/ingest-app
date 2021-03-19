import getDbInstance from '../processes/shared/rxdb/index'
var db

async function init () {
  db = await getDbInstance()
}

const collections = {
  files: {
    create: function () {

    },
    get: function (id) {

    },
    update: function () {

    },
    delete: function () {

    }
  },
  streams: {
    get: function (id) {
      return db.streams.findOne(id).exec().then(x => x ? x.toJSON() : x) // return just data if it was found
    },
    create: function (data) {
      return db.streams.insert(data)
    },
    bulkCreate: function (data) {
      return db.streams.bulkInsert(data)
    },
    update: function (data) {
      return db.streams
        .findOne(data.id).exec()
        .then((stream) => {
          const upd = {};
          ['name', 'latitude', 'longitude'].forEach((a) => {
            if (data.params[a]) {
              upd[a] = data.params[a]
            }
          })
          return stream.update({ $set: upd })
        })
    },
    delete: function (id) {
      return db.streams.findOne(id).remove()
    },
    bulkDelete: function (ids) {
      return db.streams.bulkRemove(ids)
    },
    query: function (opts) {
      let cmd = db.streams.find()
      if (opts.sort) {
        cmd = cmd.sort(opts.sort)
      }
      return cmd.exec().then(streams => streams.map(s => s.toJSON()))
    },
    stats: function () {
      return db.streams.find().exec()
        .then((streams) => {
          return streams.reduce((acc, cur) => {
            acc.preparingCount += cur.preparingCount
            acc.sessionTotalCount += cur.sessionTotalCount
            acc.sessionSuccessCount += cur.sessionSuccessCount
            acc.sessionFailCount += cur.sessionFailCount
            return acc
          }, {
            preparingCount: 0,
            sessionTotalCount: 0,
            sessionSuccessCount: 0,
            sessionFailCount: 0
          })
        })
    }
  }
}

export default {
  init,
  collections
}
