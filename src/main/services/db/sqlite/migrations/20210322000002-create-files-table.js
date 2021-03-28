export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('files', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      path: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      size_in_byte: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      duration_in_second: {
        type: Sequelize.NUMBER,
        allowNull: false,
        defaultValue: -1
      },
      extension: {
        type: Sequelize.STRING(8),
        allowNull: false
      },
      timestamp: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      },
      timezone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false
      },
      state_message: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stream_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: {
            tableName: 'streams'
          },
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      upload_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      uploaded_time: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      },
      disabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      retries: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      uploaded: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      session_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      device_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      deployment_id: {
        type: Sequelize.STRING,
        allowNull: true
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
      return queryInterface.addIndex('files', ['id'])
    }).then(() => {
      return queryInterface.addIndex('files', ['session_id'])
    }).then(() => {
      return queryInterface.addIndex('files', ['stream_id', 'state'])
    }).then(() => {
      return queryInterface.addIndex('files', ['state', 'uploaded_time'])
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('files')
  }
}
