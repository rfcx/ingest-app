import fileState from '../../../../../../utils/fileState'

export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('files',
      'state',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }).then(() => {
      const queries = Object.entries(fileState.mapPossibleStatesWithId()).map(s => {
        const [key, values] = s
        return `UPDATE files SET state=${parseInt(key)} WHERE state IN (${values.map(v => `'${v}'`).join()})`
      })
      return Promise.all(queries.map(query => {
        queryInterface.sequelize.query(query)
      }))
    })
  },
  down: (queryInterface, Sequelize) => {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn('files', 'state_id')
    ])
  }
}
