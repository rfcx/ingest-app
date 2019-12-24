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
      path: this.string(''),
      sizeInByte: this.number(0),
      extension: this.string(''),
      timestamp: this.attr(null),
      state: this.string(''), // state: waiting, uploading, ingesting, completed, fail
      stateMessage: this.string(''),
      streamId: this.string(''),
      stream: this.belongsTo(Stream, 'streamId'),
      uploadId: this.string(''),
      progress: this.number(0),
      disabled: this.boolean(false)
    }
  }

  get fileSize () {
    const bytes = this.sizeInByte
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Byte'
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
  }
}
