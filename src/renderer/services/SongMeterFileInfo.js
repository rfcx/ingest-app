import fileHelper from '../../../utils/fileHelper'

export default class SongMeterFileInfo {
  metadata = ''

  constructor (filePath) {
    return (async () => {
      try {
        const fileHeaderData = await fileHelper.readGuanMetadata(filePath)
        this.metadata = fileHeaderData || ''
        return this
      } catch (e) {
        console.error('Read file info error', e)
      }
    })()
  }

  get formattedMetadata () {
    console.log('this.metadata', this.metadata)
    // eslint-disable-next-line no-control-regex, no-useless-escape
    const formatted = (this.metadata.replace(/\n/g, ';')).replace(/[\[\]\{\}\"\x07]/g, '')
    console.log('formatted', formatted)
    return formatted
  }

  get deviceId () {
    // eslint-disable-next-line no-useless-escape
    const reg = /WA\|Song Meter\|Prefix:(?<prefix>[a-zA-Z0-9_\-]{0,12})/ig
    try {
      const matched = reg.exec(this.metadata)
      if (!matched || matched.length === 0) {
        return null
      }
      return matched.groups.prefix || null
    } catch (e) {
      return null
    }
  }

  get deployment () {
    const reg = /(?<prefix>SM-\w+)/ig
    try {
      const matched = reg.exec(this.deviceId)
      if (!matched || matched.length === 0) {
        return null
      }
      return matched.groups.prefix
    } catch (e) {
      return null
    }
  }

  get model () {
    const reg = /Model:(?<model>.*)/ig
    try {
      const matched = reg.exec(this.metadata)
      if (!matched || matched.length === 0) {
        return null
      }
      return matched.groups.model
    } catch (e) {
      return null
    }
  }

  get timezoneOffset () {
    const reg = /Timestamp:(?<year>[1-9][0-9][0-9][0-9])-(?<month>[0-1][0-9])-(?<day>[0-3][0-9]) (?<hour>[0-2][0-9]):(?<min>[0-5][0-9]):(?<sec>[0-5][0-9])(?<tzsymbol>[+-])?(?<tzhour>\d{1,2})?(:)?(?<tzmin>[0-5][0-9])?/ig
    try {
      const matched = reg.exec(this.metadata)
      if (!matched || matched.length === 0) {
        return null
      }
      const symbol = ((matched.groups.tzsymbol || '') === '-') ? -1 : 1
      const hour = (parseFloat(matched.groups.tzhour) || 0) * 60
      const min = (parseFloat(matched.groups.tzmin) || 0)
      const total = (hour + min) * symbol
      return total
    } catch (e) {
      return null
    }
  }
}
