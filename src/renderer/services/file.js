import settings from 'electron-settings'
import api from '../../../utils/api'
import File from '../store/models/File'

class FileProvider {
  uploadFile (file, idToken) {
    File.update({ where: file.id,
      data: {state: 'uploading', stateMessage: '0', progress: 0}
    })
    return api.uploadFile(this.isProductionEnv(), file.name, file.path, file.extension, file.streamId, file.timestamp, idToken, (progress) => {
      File.update({ where: file.id,
        data: {state: 'uploading', stateMessage: progress, progress: progress}
      })
    }).then((uploadId) => {
      console.log('uploadFile success', uploadId)
      return File.update({ where: file.id,
        data: {state: 'ingesting', stateMessage: '', uploadId: uploadId, progress: 100}
      })
    }).catch((error) => {
      console.log(error)
      return File.update({ where: file.id,
        data: {state: 'failed', stateMessage: error.message}
      })
    })
  }

  isProductionEnv () {
    return settings.get('settings.production_env')
  }
}

export default new FileProvider()
