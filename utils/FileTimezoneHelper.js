const fileTimezone = {
  USE_DEVICE_CONFIG: 'Timezone in metadata',
  USE_FILENAME: 'Timezone in filename',
  UTC: 'Ignore file, use UTC',
  LOCAL_TIME: 'Ignore file, use site timezone'
}

function getTimezoneOptions () {
  const options = {...fileTimezone}
  return Object.values(options)
}

export default {
  fileTimezone,
  getTimezoneOptions
}
