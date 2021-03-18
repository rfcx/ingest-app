const collection = {
  schema: {
    version: 0,
    title: 'Stream',
    keyCompression: true,
    type: 'object',
    properties: {
      id: {
        type: 'string',
        primary: true
      },
      name: {
        type: 'string'
      },
      timestampFormat: {
        type: 'string', // Auto-detect, unix-hex, custom
        default: 'Auto-detect'
      },
      folderPath: {
        type: 'string'
      },
      latitude: {
        type: 'number',
        default: 0,
        minimum: -90,
        maximum: 90
      },
      longitude: {
        type: 'number',
        default: 0,
        minimum: -180,
        maximum: 180
      },
      altitude: {
        type: 'number',
        default: 0
      },
      isPublic: {
        type: 'boolean',
        default: false
      },
      deviceId: {
        type: 'string'
      },
      env: {
        type: 'string',
        default: 'production'
      },
      preparingCount: {
        type: 'number',
        default: 0
      },
      sessionTotalCount: {
        type: 'number',
        default: 0
      },
      sessionSuccessCount: {
        type: 'number',
        default: 0
      },
      sessionFailCount: {
        type: 'number',
        default: 0
      },
      canRedo: {
        type: 'boolean',
        default: false
      },
      createdAt: {
        type: 'number'
      },
      updatedAt: {
        type: 'number'
      }
    },
    required: [
      'name'
    ],
    indexes: [
      'id',
      'updatedAt'
    ]
  },
  autoMigrate: true
}

module.exports = collection
