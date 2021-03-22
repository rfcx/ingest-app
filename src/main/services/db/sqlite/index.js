const Sequelize = require('sequelize')

async function init (app) {
  const storagePath = `${app.getPath('userData')}/database.sqlite`
  const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    operatorsAliases: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    storage: storagePath
  })
  await sequelize.authenticate()
    .then(() => {
      console.log('sqlite connection has been established successfully.')
      return sequelize.query(`CREATE TABLE IF NOT EXISTS tests (name TEXT NOT NULL);`, { type: sequelize.QueryTypes.SELECT })
    })
    .then(() => {
      return sequelize.query(`INSERT INTO tests (name) VALUES ('test-${new Date().toISOString()}')`, { type: sequelize.QueryTypes.INSERT })
    })
    .then(() => {
      return sequelize.query(`SELECT rowid, name FROM tests;`, { type: sequelize.QueryTypes.SELECT })
    })
    .then((data) => {
      console.log('Current sqlite rows in tests table', data)
    })
    .catch(err => {
      console.error('Unable to connect to the sqlite:', err)
    })
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
    },
    create: function (data) {
    },
    bulkCreate: function (data) {
    },
    update: function (data) {
    },
    delete: function (id) {
    },
    bulkDelete: function (ids) {
    },
    query: function (opts) {
    },
    stats: function () {
    }
  }
}

export default {
  init,
  collections
}
