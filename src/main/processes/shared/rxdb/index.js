import { createRxDatabase, removeRxDatabase, addRxPlugin } from 'rxdb'
import { getSchemas } from './collections'
const adapter = require('leveldown')

addRxPlugin(require('pouchdb-adapter-leveldb'))
var db
const name = 'rfcx_uploader'

export default async function () {
  if (`${process.env.CLEAR_DATABASE}` === 'true') {
    await removeRxDatabase(name, adapter)
  }
  if (!db) {
    db = await createRxDatabase({ name, adapter })
    const schemas = await getSchemas()
    await db.addCollections(schemas)
  }
  return db
}
