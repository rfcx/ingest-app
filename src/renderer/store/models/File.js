import { Model } from '@vuex-orm/core'
import Stream from './Stream'

export default class File extends Model {
  static entity = 'files'

  static fields () {
    return {
      id: this.increment(),
      name: this.string(''),
      timestamp: this.string(''),
      state: this.string(''),
      stream: this.belongsTo(Stream, 'stream_id')
    }
  }
}
