import { Model } from '@vuex-orm/core'
import Stream from './Stream'

export default class File extends Model {
  static entity = 'files'

  static primaryKey = 'name'

  static fields () {
    return {
      name: this.string(''),
      hash: this.attr(''),
      timestamp: this.attr(null),
      state: this.attr(null),
      streamId: this.string(''),
      stream: this.belongsTo(Stream, 'streamId')
    }
  }
}
