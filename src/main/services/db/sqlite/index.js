import migrateDatabase from './migrations'
import initModels from './models'
const Sequelize = require('sequelize')

let sequelize
let models

function clean () {
  if (sequelize) {
    return sequelize.drop()
  }
}

async function init (app) {
  try {
    console.log('Initializaing database...')
    const storage = `${app.getPath('userData')}/database.sqlite`
    sequelize = new Sequelize('database', 'username', 'password', {
      host: 'localhost',
      dialect: 'sqlite',
      define: {
        underscored: true,
        timestamps: true
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      logging: false,
      storage
    })
    await sequelize.authenticate()
    console.log('Database connection has been established successfully.')
    await migrateDatabase(sequelize)
    models = initModels(sequelize)
    console.log('Database models initialized successfully: ', Object.keys(models))
  } catch (err) {
    console.error('Error occured during database initialization.', err)
  }
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
      console.log('Database streams.get is called.', id)
      return models.Stream.findOne({ where: { id } })
        .then(s => s ? s.toJSON() : s)
    },
    create: function (data) {
      console.log('Database streams.create is called.', data)
      return models.Stream.create(data)
        .then(s => s.toJSON())
    },
    update: function (data) {
      console.log('Database streams.update is called.', data)
      return models.Stream.findOne({ where: { id: data.id } })
        .then((stream) => {
          ['name', 'latitude', 'longitude'].forEach((a) => {
            if (data.params[a]) {
              stream[a] = data.params[a]
            }
          })
          return stream.save()
        })
    },
    delete: function (id) {
      console.log('Database streams.update is called.', id)
      return models.Stream.destroy({ where: { id } })
    },
    query: function (opts = {}) {
      console.log('Database streams.query is called', opts)
      const where = opts.where || null
      const sort = opts.sort || null
      return models.Stream.findAll({ where, sort })
        .then((streams) => streams.map(s => s.toJSON()))
    },
    stats: function () {
      return models.Stream.findAll()
        .then((streams) => {
          return streams
            .map(s => s.toJSON())
            .reduce((acc, cur) => {
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
  clean,
  collections
}
