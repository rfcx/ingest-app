import { Model } from '@vuex-orm/core'
import Stream from './Stream'

export default class File extends Model {
  static entity = 'files'

  static primaryKey = 'id'

  static fields () {
    return {
      id: this.string(''),
      name: this.string(''),
      hash: this.attr(''),
      sha1: this.attr(''),
      path: this.string(''),
      sizeInByte: this.number(0),
      durationInSecond: this.number(0),
      extension: this.string(''),
      timestamp: this.attr(null),
      state: this.string(''), // state: preparing, local_error, waiting, uploading, ingesting, completed, server_error
      stateMessage: this.string(''),
      streamId: this.string(''),
      stream: this.belongsTo(Stream, 'streamId'),
      uploadId: this.string(''),
      progress: this.number(0),
      disabled: this.boolean(false),
      notified: this.boolean(false),
      retries: this.number(0),
      uploaded: this.boolean(false)
    }
  }

  get fileDuration () {
    var date = new Date(0)
    date.setSeconds(this.durationInSecond)
    var timeString = date.toISOString().substr(11, 8)
    return timeString
  }

  get fileSize () {
    const bytes = this.sizeInByte
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Byte'
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
  }

  get isCompleted () {
    return this.state === 'completed'
  }

  get isDuplicated () {
    return this.stateMessage.includes('duplicate')
  }

  get isError () {
    return this.state.includes('error')
  }

  get canRedo () {
    return this.state.includes('error') && !this.isDuplicated
  }
}
