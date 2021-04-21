import migrateDatabase from './migrations'
import initModels from './models'
const { Sequelize, Op } = require('sequelize')

let sequelize
let models

function clean () {
  if (sequelize) {
    return sequelize.drop()
  }
}

async function deleteAllRecords () {
  await models.File.destroy({
    where: {},
    truncate: true
  })
  await models.Stream.destroy({
    where: {},
    truncate: true
  })
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
      storage,
      operatorsAliases: {
        $lt: Op.lt,
        $gt: Op.gt,
        $gte: Op.gte
      }
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
    bulkCreate: function (data) {
      console.log(`Database files.bulkCreate is called with ${data.length} items.`)
      return models.File.bulkCreate(data, {
        validate: false // assume data is correct for speed boost
      })
    },
    update: function (data) {
      // console.log('Database files.update is called.', data)
      return models.File.findOne({ where: { id: data.id } })
        .then((file) => {
          ['durationInSecond', 'state', 'uploadId', 'stateMessage', 'progress', 'format', 'sessionId',
            'retries', 'uploaded', 'uploadedTime', 'timestamp', 'name', 'path'].forEach((a) => {
            if (data.params[a] !== undefined) {
              file[a] = data.params[a]
            }
          })
          return file.save()
        })
    },
    bulkUpdate: function (opts) {
      console.log('Database files.bulkUpdate is called.', opts)
      const where = opts.where || null
      const values = opts.values || {}
      return models.File.update(values, { where })
    },
    delete: function (opts) {
      console.log('Database files.delete is called.', opts)
      return models.File.destroy({ where: opts.where })
        .then(() => {
          return sequelize.query('VACUUM;', { type: sequelize.QueryTypes.RAW })
        })
    },
    query: function (opts = {}) {
      // console.log('Database files.query is called', opts)
      const where = opts.where || null
      const order = opts.order || null
      const limit = opts.limit || null
      const offset = opts.offset || null
      return models.File.findAll({ where, order, limit, offset })
        .then((files) => files.map(f => f.toJSON()))
    },
    deleteAll: function () {
      console.log('Database files.deleteAll is called.')
      return models.File.destroy({
        where: {},
        truncate: true
      })
    },
    sessionCount: function (sessionId) {
      return models.File.findAll({
        where: {session_id: sessionId},
        group: 'state',
        attributes: ['state', [sequelize.fn('COUNT', 'state'), 'stateCount']]
      }).then(states => {
        return states.map(s => s.dataValues)
      })
    },
    filesInStreamCount: function (streamId) {
      return models.File.findAll({
        where: {stream_id: streamId},
        group: 'state',
        attributes: ['state', [sequelize.fn('COUNT', 'state'), 'stateCount']]
      }).then(states => {
        return states.map(s => s.dataValues)
      })
    },
    filesInStreamsCount: function (streamIds) {
      return models.File.findAll({
        where: {stream_id: streamIds},
        group: ['state', 'stream_id'],
        attributes: ['state', 'streamId', [sequelize.fn('COUNT', 'state'), 'stateCount']]
      }).then(states => {
        return states.map(s => s.dataValues)
      })
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
    bulkCreate: function (data) {
      console.log(`Database streams.bulkCreate is called with ${data.length} items.`)
      return models.Stream.bulkCreate(data, {
        validate: false // assume data is correct for speed boost
      })
    },
    upsert: function (data) {
      console.log(`Database streams.upsert is called with ${data.length} items.`)
      return data.map(item => {
        return models.Stream.upsert(item, {
          validate: false // assume data is correct for speed boost
        })
      })
    },
    update: function (data) {
      console.log('Database streams.update is called.', data)
      return models.Stream.findOne({ where: { id: data.id } })
        .then((stream) => {
          ['name', 'latitude', 'longitude', 'timezone', 'timestampFormat', 'preparingCount', 'sessionTotalCount',
            'sessionSuccessCount', 'sessionFailCount'].forEach((a) => {
            if (data.params[a] !== undefined) {
              stream[a] = data.params[a]
            }
          })
          return stream.save()
        })
    },
    bulkUpdate: function (opts) {
      console.log('Database streams.bulkUpdate is called.', opts)
      const where = opts.where || null
      const values = opts.values || {}
      return models.Stream.update(values, { where })
    },
    delete: function (id) {
      console.log('Database streams.update is called.', id)
      return models.Stream.destroy({ where: { id } })
        .then(() => {
          return sequelize.query('VACUUM;', { type: sequelize.QueryTypes.RAW })
        })
    },
    deleteAll: function () {
      console.log('Database streams.deleteAll is called.')
      return models.Stream.destroy({
        where: {},
        truncate: true
      })
    },
    query: function (opts = {}) {
      console.log('Database streams.query is called', opts)
      const where = opts.where || null
      const order = opts.order || null
      const limit = opts.limit || null
      const offset = opts.offset || null
      return models.Stream.findAll({ where, order, limit, offset })
        .then((streams) => streams.map(s => s.toJSON()))
    },
    getStreamsOrderByLastModified: function (opts = {}) {
      // ['state', [sequelize.fn('COUNT', 'state'), 'stateCount']
      // const attributes = [[Sequelize.literal(`CASE WHEN updated_at > server_updated_at THEN updated_at ELSE server_updated_at END`), 'max_updated_at']]
      // order: [
      //   [sequelize.literal(CASE ${stream}.is_archived WHEN 0 THEN ${modelName}.last_updated_time ELSE -1 END), 'DESC'],
      //   ],
      // opts['order'] = [[sequelize.literal('CASE WHEN updated_at > server_updated_at THEN updated_at ELSE server_updated_at END DESC')]]
      opts['order'] = [['server_updated_at', 'DESC']]
      return collections.streams.query(opts)
    },
    getStreamWithStats: async function (opts = {}) {
      const streams = await collections.streams.getStreamsOrderByLastModified(opts)
      const ids = streams.map(s => s.id)
      const stats = await collections.files.filesInStreamsCount(ids)
      return streams.map(stream => {
        const streamStats = stats.filter(state => state.streamId === stream.id)
        return {...stream, stats: streamStats}
      })
    }
  }
}

export default {
  init,
  clean,
  deleteAllRecords,
  collections
}
