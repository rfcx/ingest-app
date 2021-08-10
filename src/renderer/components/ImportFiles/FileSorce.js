class FileSource {
  id = null
  deviceId = null
  deploymentId = null

  constructor (id, deviceId, deploymentId) {
    this.id = id
    this.deviceId = deviceId
    this.deploymentId = deploymentId
  }
}

class FileSourceFromExternal extends FileSource {
  path = null
  label = null

  constructor (id, deviceId, deploymentId, path, label) {
    super(id, deviceId, deploymentId)
    this.path = path
    this.label = label
  }
}

class FileSourceFromFolder extends FileSource {
  path = null
  constructor (id, deviceId, deploymentId) {
    super(id, deviceId, deploymentId)
    this.path = id
  }
}

class FileSourceFromFiles extends FileSource {
  selectedFiles = []
  constructor (id, deviceId, deploymentId, selectedFiles) {
    super(id, deviceId, deploymentId)
    this.selectedFiles = selectedFiles
  }
}

export default {
  FileSource,
  FileSourceFromExternal,
  FileSourceFromFolder,
  FileSourceFromFiles
}
