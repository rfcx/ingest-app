import { Model } from '@vuex-orm/core'
import File from './File'

export default class Stream extends Model {
  static entity = 'streams'

  static primaryKey = 'id'

  static fields () {
    return {
      id: this.string(''),
      name: this.string(''),
      timestampFormat: this.string(''),
      folderPath: this.string(''),
      files: this.hasMany(File, 'streamId')
    }
  }
}
