class FileSource {
  id = null
  deviceId = null
  deploymentId = null
  recorderType = null

  constructor (id, deviceId, deploymentId, recorderType) {
    this.id = id
    this.deviceId = deviceId
    this.deploymentId = deploymentId
    this.recorderType = recorderType
  }
}

class FileSourceFromExternal extends FileSource {
  path = null
  label = null

  constructor (id, deviceId, deploymentId, recorderType, path, label) {
    super(id, deviceId, deploymentId, recorderType)
    this.path = path
    this.label = label
  }
}

class FileSourceFromFolder extends FileSource {
  path = null
  constructor (id, deviceId, deploymentId, recorderType) {
    super(id, deviceId, deploymentId, recorderType)
    this.path = id
  }
}

class FileSourceFromFiles extends FileSource {
  selectedFiles = []
  constructor (id, deviceId, deploymentId, recorderType, selectedFiles) {
    super(id, deviceId, deploymentId, recorderType)
    this.selectedFiles = selectedFiles
  }
}

export default {
  FileSource,
  FileSourceFromExternal,
  FileSourceFromFolder,
  FileSourceFromFiles
}
