const fs = require('fs')
const util = require('util')
const Sequelize = require('sequelize')
const readDir = util.promisify(fs.readdir)

const sequelizeMetaTable = 'sequelize'

function getCompletedMigrations (sequelize) {
  return sequelize.query(`SELECT name FROM ${sequelizeMetaTable}`, { type: Sequelize.QueryTypes.SELECT })
    .then(migrations => migrations.map(m => m.name))
}

async function getMigrationFiles (sequelize) {
  const files = await readDir(__dirname)
  const completedMigrations = await getCompletedMigrations(sequelize)
  return files.filter(f => (f !== 'index.js' && !completedMigrations.includes(f)))
}

function createSequelizeMetatable (sequelize) {
  return sequelize.query(`CREATE TABLE IF NOT EXISTS ${sequelizeMetaTable} (name VARCHAR(255) NOT NULL UNIQUE)`)
}

function saveMigrationMeta (sequelize, filename) {
  return sequelize.query(`INSERT INTO ${sequelizeMetaTable} VALUES (:name)`, { type: Sequelize.QueryTypes.INSERT, replacements: { name: filename } })
}

export default async function migrate (sequelize) {
  console.log('Database migration: starting...')
  await createSequelizeMetatable(sequelize)
  console.log('Database migration: sequelize meta table found or created.')
  const filenames = await getMigrationFiles(sequelize)
  console.log(`Database migration: ${filenames.length} migrations to run.`)
  for (const filename of filenames) {
    try {
      console.log(`Database migration: requesting "${filename}".`)
      const migration = require(`./${filename}`).default
      console.log(`Database migration: running "${filename}".`)
      await migration.up(sequelize.queryInterface, Sequelize)
      console.log(`Database migration: saving "${filename}" into sequelize meta table.`)
      await saveMigrationMeta(sequelize, filename)
      console.log(`Database migration: "${filename}" performed.`)
    } catch (err) {
      console.error(`Database migration: "${filename}" failed`, err)
      break
    }
  }
  console.log('Database migration: ended.')
}
