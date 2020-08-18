import { Model } from '@vuex-orm/core'
import File from './File'
import FileState from '../../../../utils/fileState'

export default class Stream extends Model {
  static entity = 'streams'

  static primaryKey = 'id'

  static fields () {
    return {
      id: this.string(''),
      name: this.string(''),
      timestampFormat: this.string(''), // TODO: remove
      folderPath: this.string(''), // TODO: remove
      siteGuid: this.string(''), // TODO: remove
      latitude: this.number(0),
      longitude: this.number(0),
      files: this.hasMany(File, 'streamId'),
      createdAt: this.attr(''),
      updatedAt: this.attr(''),
      env: this.string(''),
      visibility: this.string('')
    }
  }

  get state () {
    if (this.files.length === 0) { return '' }
    const errorFiles = this.files.filter(file => FileState.isError(file.state, file.stateMessage))
    const preparingFiles = this.files.filter(file => FileState.isInPreparedGroup(file.state))
    const uploadingFiles = this.files.filter(file => FileState.isInQueuedGroup(file.state))
    const completedFiles = this.files.filter(file => FileState.isInCompletedGroup(file.state))
    const isCompleted = this.files.length === completedFiles.length
    if (uploadingFiles.length > 0) return 'uploading'
    if (errorFiles.length > 0) return 'failed'
    if (preparingFiles.length > 0) return 'preparing'
    if (isCompleted) return 'completed'
    return ''
  }

  get isError () {
    return FileState.isError(this.state)
  }

  get isUploading () {
    return this.files.filter(file => FileState.isInQueuedGroup(file.state)).length > 0
  }

  get isDuplicated () {
    return this.state === 'duplicated'
  }

  get isCompleted () {
    return this.state === 'completed'
  }

  get canRedo () {
    return this.files.filter(file => FileState.canRedo(file.state, file.stateMessage)).length > 0
  }
}
