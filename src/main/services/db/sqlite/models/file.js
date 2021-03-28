const { DataTypes } = require('sequelize')
export default function (sequelize) {
  const columns = {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    path: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    sizeInByte: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    durationInSecond: {
      type: DataTypes.NUMBER, // -1: unknown (default value) -2: error, no duration
      allowNull: false,
      defaultValue: -1
    },
    extension: {
      type: DataTypes.STRING(8),
      allowNull: false
    },
    timestamp: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING, // preparing, local_error, waiting, uploading, ingesting, completed, server_error
      allowNull: false
    },
    stateMessage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    streamId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    uploadId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    uploadedTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    retries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    uploaded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deploymentId: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }
  const File = sequelize.define('File', columns)
  File.associate = function (models) {
    File.belongsTo(models.Stream, { as: 'stream', foreignKey: 'stream_id' })
  }
  File.attributes = {
    full: Object.keys(columns),
    lite: ['id', 'name', 'timestamp', 'state', 'stream_id']
  }
  File.include = function (as = 'file', attributes = File.attributes.lite, required = true) {
    return { model: File, as, attributes, required }
  }
  return File
}
