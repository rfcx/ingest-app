import { Model } from '@vuex-orm/core'

export default class State extends Model {
  static entity = 'states'

  static fields () {
    return {
      id: this.attr(null),
      message: this.string('')
    }
  }
}
