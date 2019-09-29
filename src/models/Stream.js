import { Model } from '@vuex-orm/core'
import File from './File'

export default class User extends Model {
  static entity = 'streams'

  static fields () {
    return {
      id: this.increment(),
      name: this.string(''),
      timestampFormat: this.string(''),
      folderPath: this.string(''),
      files: this.hasMany(File, 'file_id')
    }
  }
}
