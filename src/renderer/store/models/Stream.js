import { Model } from '@vuex-orm/core'
import File from './File'
// import FileState from '../../../../utils/fileState'
// import DateHelper from '../../../../utils/dateHelper'

const AUTO_DETECT = 'Auto-detect'
// eslint-disable-next-line no-unused-vars
// const UNIX_HEX = 'unix-hex'

export default class Stream extends Model {
  static entity = 'streams'

  static primaryKey = 'id'

  static fields () {
    return {
      id: this.string(''),
      name: this.string(''),
      timestampFormat: this.string(AUTO_DETECT), // Auto-detect, unix-hex, custom
      folderPath: this.string(''), // TODO: remove
      siteGuid: this.string(''), // TODO: remove
      latitude: this.number(0),
      longitude: this.number(0),
      files: this.hasMany(File, 'streamId'),
      createdAt: this.attr(''),
      updatedAt: this.attr(''),
      env: this.string(''),
      visibility: this.string(''),
      deviceId: this.string(''),
      preparingCount: this.number(0),
      sessionTotalCount: this.number(0),
      sessionSuccessCount: this.number(0),
      sessionFailCount: this.number(0),
      canRedo: this.boolean(false)
    }
  }

  get state () {
    if (this.isUploading) return 'uploading'
    if (this.sessionFailCount > 0) return 'failed'
    if (this.preparingCount > 0) return 'preparing'
    if (this.isCompleted) return 'completed'
    return ''
  }

  // get location () {
  //   return `${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)}`
  // }

  // get defaultTimezone () {
  //   const possibleTimezones = DateHelper.getPossibleTimezonesFromLocation(this.latitude, this.longitude)
  //   if (possibleTimezones && possibleTimezones.length > 0) {
  //     return possibleTimezones[0]
  //   }
  //   return 'utc'
  // }

  // get isError () {
  //   return FileState.isError(this.state)
  // }

  // get isPreparing () {
  //   return this.preparingCount > 0
  // }

  get isUploading () {
    return this.sessionTotalCount > 0 && this.sessionTotalCount !== this.sessionSuccessCount + this.sessionFailCount
  }

  get isCompleted () {
    return this.sessionTotalCount > 0 && this.sessionTotalCount === this.sessionSuccessCount + this.sessionFailCount
  }
}
