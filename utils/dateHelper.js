const moment = require('moment')

const appDate = 'YYYY-MM-DD HH:mm:ss'

const parseTimestamp = (fileName, timestampFormat) => {
  const parts = {
    '%Y': '(?<year>[1-9][0-9][0-9][0-9])',
    '%y': '(?<year>[0-9][0-9])',
    '%M': '(?<month>[0-1][0-9])',
    '%D': '(?<day>[0-3][0-9])',
    '%H': '(?<hour>[0-2][0-9])',
    '%m': '(?<minute>[0-5][0-9])',
    '%s': '(?<second>[0-5][0-9])'
  }

  var regExpString = timestampFormat
  Object.keys(parts).forEach(key => {
    regExpString = regExpString.replace(key, parts[key])
  })

  const regExp = new RegExp(regExpString, 'g')
  var result = regExp.exec(fileName)

  // Not matched
  if (result == null) {
    return undefined
  }

  result = result.groups

  // Fix 2 character years
  if (result.year.length === 2) result.year = '20' + result.year
  return `${result.year}-${result.month}-${result.day}T${result.hour}:${result.minute}:${result.second}Z`
}

const getMomentDateFromISODate = (date) => {
  return moment.utc(date, moment.ISO_8601)
}

const getMomentDateFromAppDate = (date) => {
  return moment.utc(date, appDate)
}

const convertMomentDateToAppDate = (date) => {
  return date.format(appDate)
}

const isValidDate = (date) => {
  return date.isValid()
}

export default {
  appDate,
  parseTimestamp,
  getMomentDateFromISODate,
  getMomentDateFromAppDate,
  convertMomentDateToAppDate,
  isValidDate
}
