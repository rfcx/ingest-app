export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('streams', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      timestamp_format: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Auto-detect'
      },
      folder_path: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      latitude: {
        type: Sequelize.REAL,
        allowNull: true,
        defaultValue: 0
      },
      longitude: {
        type: Sequelize.REAL,
        allowNull: true,
        defaultValue: 0
      },
      altitude: {
        type: Sequelize.REAL,
        allowNull: true,
        defaultValue: 0
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      device_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      env: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'production'
      },
      preparing_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      session_total_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      session_success_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      session_fail_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      can_redo: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    }).then(() => {
      return queryInterface.addConstraint('streams', {
        type: 'CHECK',
        fields: ['latitude'],
        where: {
          latitude: {
            [Sequelize.Op.and]: {
              [Sequelize.Op.gte]: -90,
              [Sequelize.Op.lte]: 90
            }
          }
        }
      })
    }).then(() => {
      return queryInterface.addConstraint('streams', {
        type: 'CHECK',
        fields: ['longitude'],
        where: {
          longitude: {
            [Sequelize.Op.and]: {
              [Sequelize.Op.gte]: -180,
              [Sequelize.Op.lte]: 180
            }
          }
        }
      })
    }).then(() => {
      return queryInterface.addIndex('streams', ['id'])
    }).then(() => {
      return queryInterface.addIndex('streams', ['updated_at'])
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('streams')
  }
}
