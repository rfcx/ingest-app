import Stream from './../src/renderer/store/models/Stream'
import dateHelper from './dateHelper'
import FileState from './fileState'
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

const getState = function (stream) {
  const stats = stream.stats
  if (!stats || stats.length <= 0) return ''
  if (stats.find(stat => FileState.isInQueuedGroup(stat.state))) return 'uploading'
  if (stats.find(stat => FileState.isProcessing(stat.state))) return 'ingesting'
  if (stats.find(stat => FileState.isError(stat.state))) return 'failed'
  if (stats.find(stat => FileState.isInPreparedGroup(stat.state))) return 'preparing'
  if (stats.find(stat => FileState.isInCompletedGroup(stat.state))) return 'completed'
  return ''
}

const insertSites = async function (sites) {
  const idOfSitesInUploadingSession = Stream.query().where(stream => {
    return stream.sessionTotalCount > 0 || stream.sessionSuccessCount > 0 || stream.sessionFailCount > 0
  }).get().map(stream => stream.id)
  const sitesInuploadingSession = sites.filter(site => idOfSitesInUploadingSession.includes(site.id))
  const otherSites = sites.filter(site => !idOfSitesInUploadingSession.includes(site.id))
  await Stream.insertOrUpdate({ data: sitesInuploadingSession })
  await Stream.insert({ data: otherSites })
  console.log('[sitesInuploadingSession] insertOrUpdate sites', sitesInuploadingSession.length)
  console.log('[otherSites] insert sites', otherSites.length)
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
  insertSites,
  parseUserSites,
  parseSite,
  getState
}
