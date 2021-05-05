const fileTimezone = {
  UTC: 'UTC Time',
  LOCAL_TIME: 'Local Time'
}

function getTimezoneOptions (localTimezone) {
  const options = {...fileTimezone}
  options['LOCAL_TIME'] = `${fileTimezone.LOCAL_TIME} (${localTimezone})`
  return Object.values(options)
}

function getTimezoneOfTheList (files) {
  // if all files is audiomoth files then timezone = UTC
  // default = Local time
}

function canEditTimezoneOfTheList (files) {
  // if all files is audiomoth files then can edit = false
}

export default {
  getTimezoneOptions,
  getTimezoneOfTheList,
  canEditTimezoneOfTheList
}
