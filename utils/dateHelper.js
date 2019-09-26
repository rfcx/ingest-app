const moment = require('moment')

const appDate = 'YYYY-MM-DD HH:mm:ss'

const debugLog = true
function print (any) {
  if (debugLog) console.log(any)
}
module.exports = {
  appDate: appDate,
  getDateTime: (fileName, timeStampFormat) => {
    print('filename: ' + fileName + ' timestamp format: ' + timeStampFormat)
    const stringOffsetYear = timeStampFormat.search(/Y/)
    const stringOffsetMonth = timeStampFormat.search(/M/)
    const stringOffsetDay = timeStampFormat.search(/D/)
    const stringOffsetHour = timeStampFormat.search(/H/)
    const stringOffsetMin = timeStampFormat.search(/m/)
    const stringOffsetSec = timeStampFormat.search(/s/)
    const year = fileName.substr(stringOffsetYear, 4)
    const month = fileName.substr(stringOffsetMonth, 2)
    const day = fileName.substr(stringOffsetDay, 2)
    const hour = fileName.substr(stringOffsetHour, 2)
    const min = fileName.substr(stringOffsetMin, 2)
    const sec = fileName.substr(stringOffsetSec, 2)
    print(stringOffsetYear + '=' + year)
    print(stringOffsetMonth + '=' + month)
    print(stringOffsetDay + '=' + day)
    print(stringOffsetHour + '=' + hour)
    print(stringOffsetMin + '=' + min)
    print(stringOffsetSec + '=' + sec)

    // add milli sec
    const milliSeconds = 0
    // add timezone offset
    // TODO: check pref timestamp
    const timezoneOffset = '+0000'

    const dateTimeISO = year + '-' + month + '-' + day + 'T' + hour + ':' + min + ':' + sec + '.' + milliSeconds + timezoneOffset
    print('date iso: ' + dateTimeISO)
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
