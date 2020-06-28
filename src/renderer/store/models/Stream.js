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
      timestampFormat: this.string(''),
      folderPath: this.string(''),
      siteGuid: this.string(''),
      files: this.hasMany(File, 'streamId'),
      env: this.string(''),
      visibility: this.string('')
    }
  }

  get state () {
    const errorFiles = this.files.filter(file => FileState.canRedo(file.state, file.stateMessage))
    const uploadingFiles = this.files.filter(file => FileState.isInQueuedGroup(file.state))
    const completedFiles = this.files.filter(file => FileState.isInCompletedGroup(file.state))
    const isCompleted = this.files.length === completedFiles.length
    if (uploadingFiles.length > 0) return 'uploading'
    if (errorFiles.length > 0) return 'failed'
    if (isCompleted) return 'completed'
    // if (this.files && !this.files.length) {
    //   return 'waiting'
    // }
    // const hasFiles = this.files && this.files.length
    // const total = this.files.length
    // const completedFiles = this.files.filter(file => file.state === 'completed').length
    // const waitingFiles = this.files.filter(file => file.state === 'waiting').length
    // const failedFiles = this.files.filter(file => file.state.includes('error') && !file.stateMessage.includes('duplicated')).length
    // const duplicatedFiles = this.files.filter(file => file.stateMessage.includes('duplicated')).length
    // const ingestingFiles = this.files.filter(file => file.state === 'ingesting').length
    // const isCompleted = hasFiles && total === completedFiles
    // const isWaiting = hasFiles && total === waitingFiles
    // const isFailed = hasFiles && failedFiles > 0 && total === (failedFiles + duplicatedFiles)
    // const isDuplicated = hasFiles && total === duplicatedFiles
    // const isIngesting = hasFiles && total === ingestingFiles
    // if (isCompleted) return 'completed'
    // else if (isWaiting) return 'waiting'
    // else if (isFailed) return 'failed'
    // else if (isDuplicated) return 'duplicated'
    // else if (isIngesting) return 'ingesting'
    // return 'uploading'
  }

  get isError () {
    return FileState.isError(this.state)
  }

  get isUploading () {
    console.log('g isUploading')
    return this.files.filter(file => FileState.isInQueuedGroup(file.state)).length > 0
  }

  get isDuplicated () {
    return this.state === 'duplicated'
  }

  get isCompleted () {
    return this.state === 'completed'
  }

  get canRedo () {
    return this.state.includes('error') && !this.isDuplicated
  }

  stateIsDuplicated () {
    return this.state === 'duplicated'
  }
}
