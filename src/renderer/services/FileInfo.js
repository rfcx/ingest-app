import fs from 'fs'
import { WaveFile } from 'wavefile'
import moment from 'moment'

export default class FileInfo {
  comment = ''
  authors = ''

  constructor (filePath) {
    try {
      const buffer = fs.readFileSync(filePath)
      const wav = new WaveFile(buffer)
      this.comment = wav.getTag('ICMT') || ''
      this.authors = wav.getTag('IART') || ''
    } catch (e) {
      console.log('Read file info error', e)
    }
  }

  get deviceId () {
    return this.authors !== '' ? this.authors.replace(/AudioMoth\s/g, '').trim() : ''
  }

  get recordedDate () {
    const reg = /((([0-2]{1})([0-3]{1})):(([0-5]{1})([0-9]{1})):(([0-5]{1})([0-9]{1})))\s(([0-2]\d|[3][0-1])\/([0]\d|[1][0-2])\/([2][01]|[1][6-9])\d{2})/ig
    try {
      const matched = this.comment.match(reg)
      const dateStr = matched[0]
      if (!dateStr) {
        return null
      }
      const md = moment(dateStr, 'HH:mm:ss DD/MM/YYYY')
      return md.isValid() ? md : null
    } catch (e) {
      return null
    }
  }

  get fileName () {
    const date = this.recordedDate
    return date ? date.format('YYYYMMDD_HHmmss') : ''
  }

  get deployment () {
    const reg = /deployment\s\d*\s/ig
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
