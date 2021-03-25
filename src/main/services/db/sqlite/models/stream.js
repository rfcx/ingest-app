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
    timestampFormat: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Auto-detect'
    },
    folderPath: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    latitude: {
      type: DataTypes.REAL,
      allowNull: true,
      defaultValue: 0,
      validate: {
        isFloat: true,
        min: {
          args: [-90],
          msg: 'latitude should be equal to or greater than -90'
        },
        max: {
          args: [90],
          msg: 'latitude should be equal to or less than 90'
        }
      }
    },
    longitude: {
      type: DataTypes.REAL,
      allowNull: true,
      defaultValue: 0,
      validate: {
        isFloat: true,
        min: {
          args: [-180],
          msg: 'longitude should be equal to or greater than -180'
        },
        max: {
          args: [180],
          msg: 'longitude should be equal to or less than 180'
        }
      }
    },
    altitude: {
      type: DataTypes.REAL,
      allowNull: true,
      defaultValue: 0
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    env: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'production'
    },
    preparingCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    sessionTotalCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    sessionSuccessCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    sessionFailCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    canRedo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  }
  const Stream = sequelize.define('Stream', columns)
  Stream.associate = function (models) {
  }
  Stream.attributes = {
    full: Object.keys(columns),
    lite: ['id', 'name', 'is_public', 'env']
  }
  Stream.include = function (as = 'stream', attributes = Stream.attributes.lite, required = true) {
    return { model: Stream, as, attributes, required }
  }
  return Stream
}
