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

const getState = function (stream) {
  if (stream.isUploading) return 'uploading'
  if (stream.sessionFailCount > 0) return 'failed'
  if (stream.preparingCount > 0) return 'preparing'
  if (stream.isCompleted) return 'completed'
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
    return {
      id: site.id,
      name: site.name,
      timestampFormat: 'Auto-detect',
      latitude: site.latitude || 0,
      longitude: site.longitude || 0,
      files: [],
      createdAt: Date.parse(site.created_at),
      updatedAt: Date.parse(site.updated_at),
      env: isProductionEnv() ? 'production' : 'staging',
      visibility: site.is_public,
      timezone: ''
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
  parseUserSites,
  getState
}
