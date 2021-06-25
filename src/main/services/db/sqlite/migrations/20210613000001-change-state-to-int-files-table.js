import fileState from '../../../../../../utils/fileState'

const mapPossibleStatesWithId = function () {
  let stateObject = {}
  for (const [key, id] of Object.entries(fileState.state)) {
    switch (key) {
      case 'ERROR_LOCAL':
        stateObject[`${id}`] = ['local_error']
        break
      case 'ERROR_SERVER':
        stateObject[`${id}`] = ['server_error', 'failed']
        break
      case 'PROCESSING':
        stateObject[`${id}`] = ['processing', 'ingesting']
        break
      default:
        stateObject[`${id}`] = [key.toLowerCase()]
    }
  }
  return stateObject
}

export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('files',
      'state',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }).then(() => {
      const queries = Object.entries(mapPossibleStatesWithId()).map(s => {
        const [key, values] = s
        return `UPDATE files SET state=${parseInt(key)} WHERE state IN (${values.map(v => `'${v}'`).join()})`
      })
      return Promise.all(queries.map(query => {
        queryInterface.sequelize.query(query)
      }))
    }).then(() => {
      return queryInterface.addIndex('files', ['id'])
    }).then(() => {
      return queryInterface.addIndex('files', ['session_id'])
    }).then(() => {
      return queryInterface.addIndex('files', ['stream_id', 'updated_at'])
    }).then(() => {
      return queryInterface.addIndex('files', ['stream_id', 'state'])
    }).then(() => {
      return queryInterface.addIndex('files', ['state', 'uploaded_time'])
    })
  }
}
