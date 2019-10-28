const moment = require('moment')

const appDate = 'YYYY-MM-DD HH:mm:ss'

const debugLog = false
function log (any) {
  if (debugLog) console.log(any)
}
module.exports = {
  appDate: appDate,
  getDateTime: (fileName, timeStampFormat) => {
    log('timestamp format: ' + timeStampFormat)
    timeStampFormat = timeStampFormat.replace(/%/g, '')
    log('filename: ' + fileName + ' timestamp format: ' + timeStampFormat)
    const stringOffsetYear4Digits = timeStampFormat.search(/Y/)
    const stringOffsetYear2Digits = timeStampFormat.search(/y/)
    const stringOffsetMonth = timeStampFormat.search(/M/)
    const stringOffsetDay = timeStampFormat.search(/D/)
    const stringOffsetHour = timeStampFormat.search(/H/)
    const stringOffsetMin = timeStampFormat.search(/m/)
    const stringOffsetSec = timeStampFormat.search(/s/)
    const year4Digits = fileName.substr(stringOffsetYear4Digits, 4)
    const year2Digits = fileName.substr(stringOffsetYear2Digits, 2)
    const year = (stringOffsetYear4Digits !== -1) ? year4Digits : '20' + year2Digits // FIXME: refactor this
    const month = fileName.substr(stringOffsetMonth, 2)
    const day = fileName.substr(stringOffsetDay, 2)
    const hour = fileName.substr(stringOffsetHour, 2)
    const min = fileName.substr(stringOffsetMin, 2)
    const sec = fileName.substr(stringOffsetSec, 2)
    log(stringOffsetYear4Digits + '=' + year4Digits)
    log(stringOffsetYear2Digits + '=' + year2Digits)
    log(stringOffsetMonth + '=' + month)
    log(stringOffsetDay + '=' + day)
    log(stringOffsetHour + '=' + hour)
    log(stringOffsetMin + '=' + min)
    log(stringOffsetSec + '=' + sec)

    // add milli sec
    const milliSeconds = 0
    // add timezone offset
    // TODO: check pref timestamp
    const timezoneOffset = '+0000'

    const dateTimeISO = year + '-' + month + '-' + day + 'T' + hour + ':' + min + ':' + sec + '.' + milliSeconds + timezoneOffset
    log('date iso: ' + dateTimeISO)
    return dateTimeISO
  },
  getMomentDateFromISODate: (date) => {
    return moment.utc(date, moment.ISO_8601)
  },
  getMomentDateFromAppDate: (date) => {
    return moment.utc(date, appDate)
  },
  convertMomentDateToAppDate: (date) => {
    return date.format(appDate)
  },
  isValidDate: (date) => {
    return date.isValid()
  }
}
