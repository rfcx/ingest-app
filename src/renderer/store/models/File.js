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
      timestamp: this.attr(null),
      state: this.string(''), // state: waiting, uploading, fail
      stateMessage: this.string(''),
      streamId: this.string(''),
      stream: this.belongsTo(Stream, 'streamId')
    }
  }
}
