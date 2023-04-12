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
      /* {
        PREPARING: 10, // in prepare tab
        ERROR_LOCAL: 20, // e.g. file not found, file not support
        ERROR_SERVER: 21, // e.g. duplicated, network error
        DUPLICATED: 22, // specified case for server error
        CONVERTING: 30, // converting to flac
        UPLOADING: 31, // uploading to server
        WAITING: 32, // in queue waiting to upload
        STOPPED: 33, // stop gueued file to upload
        PROCESSING: 40, // uploaded, but in process of a.k.a. verifing / ingesting
        COMPLETED: 50 // uploaded and ingested
      } */
      type: DataTypes.INTEGER,
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
