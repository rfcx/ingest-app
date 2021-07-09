import dateHelper from './dateHelper'
import FileState from './fileState'
import settings from 'electron-settings'
const { PREPARING, ERROR_SERVER, UPLOADING, PROCESSING, COMPLETED } = FileState.state

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

const getState = function (stream) {
  const stats = stream.stats
  if (!stats || stats.length <= 0) return ''
  if (stats.find(stat => FileState.isInQueuedGroup(stat.state))) return UPLOADING
  if (stats.find(stat => FileState.isProcessing(stat.state))) return PROCESSING
  if (stats.find(stat => FileState.isError(stat.state))) return ERROR_SERVER
  if (stats.find(stat => FileState.isInPreparedGroup(stat.state))) return PREPARING
  if (stats.find(stat => FileState.isInCompletedGroup(stat.state))) return COMPLETED
  return ''
}

const parseUserSites = (sites) => {
  return sites.map((site) => {
    return parseSite(site)
  })
}

const parseSite = (site) => {
  const latitude = site.latitude || 0
  const longitude = site.longitude || 0
  return {
    id: site.id,
    name: site.name,
    timestampFormat: 'Auto-detect',
    latitude: latitude,
    longitude: longitude,
    files: [],
    serverCreatedAt: new Date(site.created_at),
    serverUpdatedAt: new Date(site.updated_at),
    env: isProductionEnv() ? 'production' : 'staging',
    visibility: site.is_public,
    timezone: dateHelper.getDefaultTimezone(latitude, longitude),
    projectId: site.project ? site.project.id : null,
    projectName: site.project ? site.project.name : null
  }
}

const isProductionEnv = () => {
  return settings.get('settings.production_env')
}

export default {
  isValidName,
  getNameError,
  parseUserSites,
  parseSite,
  getState
}
