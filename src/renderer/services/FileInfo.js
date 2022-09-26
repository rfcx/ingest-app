import audio from '../../../services/audio'
import moment from 'moment'

export default class FileInfo {
  comment = ''
  authors = ''
  duration = -1

  constructor (filePath) {
    return (async () => {
      try {
        const fileHeaderData = await audio.identify(filePath)
        this.comment = fileHeaderData.comment || ''
        this.authors = fileHeaderData.artist || ''
        this.duration = fileHeaderData.duration
        return this
      } catch (e) {
        console.log('Read file info error', e)
      }
    })()
  }

  get deviceId () {
    const getDeviceId = string => string.replace(/AudioMoth\s/g, '').trim()
    if (this.authors !== '') {
      return getDeviceId(this.authors)
    }
    const reg = /AudioMoth\s\w*\s/ig
    try {
      const matched = this.comment.match(reg)
      return getDeviceId(matched[0])
    } catch (e) {
      return ''
    }
  }

  /**
   * Return moment date or 'null'
   */
  get recordedDate () {
    const reg = /(?<date>(?:[0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\s(?:[0-2]\d|[3][0-1])\/(?:[0]\d|[1][0-2])\/(?:[2][01]|[1][6-9])\d{2})/ig
    const matched = reg.exec(this.comment)
    if (!matched || matched.length === 0) {
      return null
    }
    const dateStr = matched.groups.date
    const timestamp = moment.utc(dateStr, 'HH:mm:ss DD/MM/YYYY')
    timestamp.utcOffset(this.timezoneOffset, true)
    if (!timestamp.isValid()) {
      return null
    }
    return timestamp
  }

  get timezoneOffset () {
    const reg = /((?<prefix>UTC)(?<symbol>[+-])?(?<hour>\d{1,2})?(:)?(?<min>[0-5][0-9])?)/ig
    try {
      const matched = reg.exec(this.comment)
      if (!matched || matched.length === 0) {
        return null
      }
      const symbol = ((matched.groups.symbol || '') === '-') ? -1 : 1
      const hour = (parseFloat(matched.groups.hour) || 0) * 60
      const min = (parseFloat(matched.groups.min) || 0)
      const total = (hour + min) * symbol
      return total
    } catch (e) {
      return null
    }
  }

  get fileName () {
    const date = this.recordedDate
    return date ? date.format('YYYYMMDD_HHmmss') : ''
  }

  get deployment () {
    const reg = /deployment\s[\da-f]*\s/ig
    try {
      const matched = this.comment.match(reg)
      return matched[0].replace(/deployment\s/, '').trim()
    } catch (e) {
      return ''
    }
  }

  get batteryState () {
    const reg = /battery\sstate\swas\s\d{1,2}\.\d{1,2}\w{1}/ig
    try {
      const matched = this.comment.match(reg)
      return matched[0].replace(/battery\sstate\swas\s/, '').trim()
    } catch (e) {
      return ''
    }
  }

  get temperature () {
    const reg = /temperature\swas\s\d{1,3}\.\d{1,3}\w{1}/ig
    try {
      const matched = this.comment.match(reg)
      return matched[0].replace(/temperature\swas\s/, '').trim()
    } catch (e) {
      return ''
    }
  }
}
