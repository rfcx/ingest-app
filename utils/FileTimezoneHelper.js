const fileTimezone = {
  UTC: 'UTC Time',
  LOCAL_TIME: 'Local Time'
}

function getTimezoneOptions (localTimezone) {
  const options = {...fileTimezone}
  options['LOCAL_TIME'] = `${fileTimezone.LOCAL_TIME} (${localTimezone})`
  return Object.values(options)
}
function getSelectedTimezoneValue (text) {
  if (text.includes(fileTimezone.LOCAL_TIME)) return text.replace(`${fileTimezone.LOCAL_TIME} (`, '').replace(')', '')
  else return ''
}

function getTimezoneOfTheList (files) {
  // TODO: if all files is audiomoth files then timezone = UTC
  // default = Local time
}

function canEditTimezoneOfTheList (files) {
  // TODO: if all files is audiomoth files then can edit = false
}

export default {
  fileTimezone,
  getSelectedTimezoneValue,
  getTimezoneOptions,
  getTimezoneOfTheList,
  canEditTimezoneOfTheList
}
