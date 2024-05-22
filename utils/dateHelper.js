import fileFormat from './FileFormat'

const moment = require('moment-timezone')
const appDate = 'YYYY-MM-DD HH:mm:ss'

const getIsoDateWithFormat = (format, fileName) => {
  switch (format) {
    case fileFormat.fileFormat.AUTO_DETECT: return parseTimestampAuto(fileName)
    case fileFormat.fileFormat.UNIX_HEX: return parseTimestampUnixHex(fileName)
    default: return parseTimestamp(fileName, format)
  }
}

const getYear = (fileName) => {
  return moment(parseTimestampAuto(fileName), appDate).year()
}

const formatIso = (obj) => {
  if (obj.year && obj.year.length === 2) {
    obj.year = '20' + obj.year
  }
  if (obj.hour12) {
    if (obj.hour12ap === 'pm' || obj.hour12ap === 'p' || obj.hour12ap === 'PM' || obj.hour12ap === 'P') {
      obj.hour = (parseInt(obj.hour12) + 12).toString()
    } else {
      obj.hour = obj.hour12
    }
  }
  if (!obj.second) {
    obj.second = '00'
  }
  if (!obj.timezone) {
    obj.timezone = ''
  }
  const datePart = `${obj.year}-${obj.month.padStart(2, '0')}-${obj.day.padStart(2, '0')}`
  const timePart = `${obj.hour.padStart(2, '0')}:${obj.minute.padStart(2, '0')}:${obj.second.padStart(2, '0')}`
  return `${datePart}T${timePart}${obj.timezone}`
}

const parseTimestamp = (fileName, timestampFormat) => {
  const parts = {
    '%Y': '(?<year>[1-9][0-9][0-9][0-9])',
    '%y': '(?<year>[0-9][0-9])',
    '%M': '(?<month>[0-1][0-9])',
    '%m': '(?<month>1?[0-9])',
    '%N': '(?<month>January|February|March|April|May|June|July|August|September|October|November|December)',
    '%n': '(?<month>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)',
    '%D': '(?<day>[0-3][0-9])',
    '%d': '(?<day>[1-3]?[0-9])',
    '%H': '(?<hour>[0-2][0-9])',
    '%h': '(?<hour>[1-2]?[0-9])',
    '%G': '(?<hour12>0[0-9]|1[0-1])',
    '%g': '(?<hour12>[0-9]|1[0-1])',
    '%A': '(?<hour12ap>AM|PM|am|pm)',
    '%a': '(?<hour12ap>A|P|a|p)',
    '%I': '(?<minute>[0-5][0-9])',
    '%i': '(?<minute>[1-5]?[0-9])',
    '%S': '(?<second>[0-5][0-9])',
    '%s': '(?<second>[1-5]?[0-9])',
    '%Z': '(?<timezone>\\+[0-9][0-9][0-9][0-9])',
    '%z': '(?<timezone>[A-Z][A-Z][A-Z])'
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

  return formatIso(result.groups)
}

const parseTimestampAuto = (input) => {
  // Test "year month day", "day month year", "[a-zA-Z]{3}[0-9]{4} year month day", "[a-zA-Z]{6} [a-zA-Z]{3} [a-zA-Z]{3} [a-zA-Z]{3} [a-zA-Z]{2}[0-9]{2} year month day"
  const test1 = '(?<year>(19|20)[0-9][0-9])[- /.]?(?<month>0[1-9]|1[012])[- /.]?(?<day>0[1-9]|[12][0-9]|3[01]).?(?<hour>[0-1][0-9]|2[0-3])[- :.]?(?<minute>[0-5][0-9])[- :.]?(?<second>[0-5][0-9])?'
  const test5 = '(?<year>[0-9][0-9])[- /.]?(?<month>0[1-9]|1[012])[- /.]?(?<day>0[1-9]|[12][0-9]|3[01]).?(?<hour>[0-1][0-9]|2[0-3])[- :.]?(?<minute>[0-5][0-9])[- :.]?(?<second>[0-5][0-9])?'
  const test2 = '(?<day>0[1-9]|[12][0-9]|3[01])[- /.]?(?<month>0[1-9]|1[012])[- /.]?(?<year>(19|20)[0-9][0-9]).?(?<hour>[0-1][0-9]|2[0-3])[- :.]?(?<minute>[0-5][0-9])[- :.]?(?<second>[0-5][0-9])?'
  const test6 = '(?<day>0[1-9]|[12][0-9]|3[01])[- /.]?(?<month>0[1-9]|1[012])[- /.]?(?<year>[0-9][0-9]).?(?<hour>[0-1][0-9]|2[0-3])[- :.]?(?<minute>[0-5][0-9])[- :.]?(?<second>[0-5][0-9])?'
  const test3 = '(?<string>[a-zA-Z]{3}[0-9]{4})[-._ ]?(?<year>(19|20)[0-9][0-9])[- /._]?(?<month>0[1-9]|1[012])[- /._]?(?<day>0[1-9]|[12][0-9]|3[01]).?(?<hour>[0-1][0-9]|2[0-3])[- :.]?(?<minute>[0-5][0-9])[- :.]?(?<second>[0-5][0-9])?'
  const test4 = '(?<string>[a-zA-Z]{6}[-._ ]?[a-zA-Z]{3}[-._ ]?[a-zA-Z]{3}[-._ ]?[a-zA-Z]{3}[-._ ]?[a-zA-Z]{2}[0-9]{2})[-._ ]?(?<year>(19|20)[0-9][0-9])[- /._]?(?<month>0[1-9]|1[012])[- /._]?(?<day>0[1-9]|[12][0-9]|3[01]).?(?<hour>[0-1][0-9]|2[0-3])[- :.]?(?<minute>[0-5][0-9])[- :.]?(?<second>[0-5][0-9])?'
  const regExp3 = new RegExp(test3, 'g')
  var result = regExp3.exec(input)
  if (result == null) {
    const regExp4 = new RegExp(test4, 'g')
    result = regExp4.exec(input)
    if (result == null) {
      const regExp1 = new RegExp(test1, 'g')
      result = regExp1.exec(input)
      if (result == null) {
        const regExp2 = new RegExp(test2, 'g')
        result = regExp2.exec(input)
        if (result == null) {
          const regExp5 = new RegExp(test5, 'g')
          result = regExp5.exec(input)
          if (result == null) {
            const regExp6 = new RegExp(test6, 'g')
            result = regExp6.exec(input)
            if (result == null) {
              return undefined
            }
          }
        }
      }
    }
  }
  return formatIso(result.groups)
}

const isHex = (string) => {
  var num = parseInt(string, 16)
  return (num.toString(16).toLowerCase() === string.toLowerCase())
}

const parseTimestampUnixHex = (filenameWithExtension) => {
  const filename = filenameWithExtension.replace(/\.[^/.]+$/, '')
  if (!isHex(filename)) {
    return undefined
  } else {
    const date = moment.utc('1970-01-01').add(parseInt(filename, 16), 'seconds')
    return moment(date, 'YYYY-DD-MM').isValid() ? date.toISOString() : undefined
  }
}

const getPossibleTimezonesFromLocation = (latitude, longitude) => {
  const geoTz = require('geo-tz')
  return geoTz(latitude, longitude)
}

const getDefaultTimezone = (latitude, longitude) => {
  const possibleTimezones = getPossibleTimezonesFromLocation(latitude, longitude)
  if (possibleTimezones && possibleTimezones.length > 0) {
    return possibleTimezones[0]
  }
  return 'utc'
}

/**
 * Get timezone offset (minutes) from timezone name
 * @param timezone: timezone string  e.g. 'Asia/Bangkok'
 */
const tzOffsetMinutesFromTzName = (timezoneName) => {
  return getMomentFromTimezoneName(timezoneName).utcOffset()
}

/**
 * Get timezone offset (formatted) from timezone name
 * @param timezone: timezone string  e.g. 'Asia/Bangkok'
 */
const formattedTzOffsetFromTimezoneName = (timezoneName) => {
  return getMomentFromTimezoneName(timezoneName).format('zZ')
}

const formattedTzOffsetFromTzMinutes = (offsetMinute) => {
  return moment().utcOffset(offsetMinute).format('zZ')
}

const getMomentFromTimezoneName = (timezone) => {
  if (!timezone) return null
  const dateString = moment().tz(timezone).format()
  return moment.parseZone(dateString)
}

const getMomentDateFromISODate = (date) => {
  return moment.utc(date, moment.ISO_8601)
}

const getMomentDateFromISODateNow = () => {
  return moment.utc(moment().format('YYYY-MM-DD HH:mm:ss'), moment.ISO_8601)
}

const getMomentDateFromISODatePast = (date) => {
  return moment.utc(moment('1971-01-01 00:00:00.0'), moment.ISO_8601)
}

const convertMomentDateToAppDate = (date) => {
  return date.format(appDate)
}

export default {
  getIsoDateWithFormat,
  getYear,
  getMomentDateFromISODate,
  getMomentDateFromISODateNow,
  getMomentDateFromISODatePast,
  getDefaultTimezone,
  getPossibleTimezonesFromLocation,
  tzOffsetMinutesFromTzName,
  formattedTzOffsetFromTimezoneName,
  formattedTzOffsetFromTzMinutes,
  convertMomentDateToAppDate
}
