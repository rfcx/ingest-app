export default {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'streams', // table name
        'server_updated_at', // new field name
        {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null
        }
      ),
      queryInterface.addColumn(
        'streams',
        'server_created_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null
        }
      )
    ])
  },
  down: (queryInterface, Sequelize) => {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn('streams', 'server_updated_at'),
      queryInterface.removeColumn('streams', 'server_created_at')
    ])
  }
}
