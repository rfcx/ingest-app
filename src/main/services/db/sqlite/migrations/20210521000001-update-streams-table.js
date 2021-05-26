export default {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'streams',
        'project_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: null
        }
      ),
      queryInterface.addColumn(
        'streams',
        'project_name',
        {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: null
        }
      )
    ])
  },
  down: (queryInterface, Sequelize) => {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn('streams', 'project_id'),
      queryInterface.removeColumn('streams', 'project_name')
    ])
  }
}
