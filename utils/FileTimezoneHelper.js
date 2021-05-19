const fileTimezone = {
  UTC: 'UTC Time',
  LOCAL_TIME: 'Local Time'
}

function getTimezoneOptions (localTimezone) {
  const options = {...fileTimezone}
  options['LOCAL_TIME'] = `${fileTimezone.LOCAL_TIME} (${localTimezone})`
  return Object.values(options)
}

function getSelectedTimezoneOption (text) {
  if (text.includes(fileTimezone.LOCAL_TIME)) return fileTimezone.LOCAL_TIME
  else if (text.includes(fileTimezone.UTC)) return fileTimezone.UTC
  else return undefined
}

export default {
  fileTimezone,
  getTimezoneOptions,
  getSelectedTimezoneOption
}
