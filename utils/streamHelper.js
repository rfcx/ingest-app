import Stream from './../src/renderer/store/models/Stream'
import settings from 'electron-settings'

const getNameError = (streamName) => {
  if (!checkMinLength(streamName)) {
    return 'Minimum stream name length is 3 characters.'
  } else if (!checkMaxLength(streamName)) {
    return 'Maximum stream name length is 40 characters.'
  }
}

const isValidName = (streamName) => {
  return checkMinLength(streamName) && checkMaxLength(streamName)
}

const checkMinLength = (streamName) => {
  return streamName.trim().length && streamName.trim().length > 2
}

const checkMaxLength = (streamName) => {
  return streamName.trim().length && streamName.trim().length <= 40
}

const insertSites = async function (sites) {
  await Stream.insert({ data: sites })
  console.log('insert sites: ', sites)
}

const parseUserSites = (sites) => {
  return sites.map((site) => {
    return {
      id: site.id,
      name: site.name,
      timestampFormat: 'Auto-detect',
      latitude: site.latitude || 0,
      longitude: site.longitude || 0,
      files: [],
      createdAt: site.created_at,
      updatedAt: site.updated_at,
      env: isProductionEnv() ? 'production' : 'staging',
      visibility: site.is_public
    }
  })
}

const isProductionEnv = () => {
  return settings.get('settings.production_env')
}

export default {
  isValidName,
  getNameError,
  insertSites,
  parseUserSites
}
