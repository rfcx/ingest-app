const fileTimezone = {
  UTC: 'UTC',
  LOCAL_TIME: 'Site timezone',
  USE_AUDIOMOTH_CONFIG: 'AudioMoth configuration',
  USE_FILENAME: 'Timezone in filename'
}

function getTimezoneOptions () {
  const options = {...fileTimezone}
  return Object.values(options)
}

export default {
  fileTimezone,
  getTimezoneOptions
}
