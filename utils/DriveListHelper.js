import * as drivelist from 'drivelist'

class DriveListHelper {
  async getExternalDriveList () {
    const drives = await drivelist.list()
    return Promise.resolve(drives.filter(drive => drive.isCard || drive.isUSB).map(drive => this.toDriveObject(drive)).filter(item => item != null))
  }

  toDriveObject (drive) {
    if (!drive.mountpoints || drive.mountpoints.length === 0) return null
    const id = [
      drive.device,
      drive.size,
      drive.description,
      drive.mountpoints
        .map((m) => m.path)
        .sort()
        .join(',')
    ].join('|')
    const path = drive.mountpoints[0].path
    let label = drive.mountpoints[0].label
    if (!label || label.length === 0) { // if no name set
      label = drive.busType + ` ${path}`
    }
    return { id, path, label }
  }
}

export default new DriveListHelper()
