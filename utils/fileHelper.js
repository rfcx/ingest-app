import FileTimezoneHelper from './FileTimezoneHelper'
import audioService from '../services/audio'
import FileInfo from '../src/renderer/services/FileInfo'
const sha1File = require('sha1-file')
const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')
const archiver = require('archiver')

const dayInMs = 1000 * 60 * 60 * 24

const getFilePath = (directoryPath, fileName) => {
  return path.join(directoryPath, fileName)
}

const isExist = (path) => {
  return fs.existsSync(path)
}

const isFolder = (filePath) => {
  return fs.lstatSync(filePath).isDirectory()
}

const readFile = (filePath) => {
  return fs.readFileSync(filePath)
}

const getExtension = (fileName) => {
  return fileName.split('.').pop().toLowerCase()
}

const getFilesFromDirectoryPath = (directoryPath) => {
  if (fs.existsSync(directoryPath)) {
    return fs.readdirSync(directoryPath).filter(item => !(/(^|\/)\.[^/.]/g).test(item))
  }
  return undefined
}

const getCheckSum = (filePath) => {
  const checksum = sha1File(filePath)
  return checksum
}

const getFileNameFromFilePath = (filePath) => {
  return path.parse(filePath).base
}

const getDirectoryFromFilePath = (filePath) => {
  return path.dirname(filePath)
}

const getFileName = (fileName) => {
  const ext = '.' + getExtension(fileName)
  return fileName.replace(ext, '')
}

const getFileSize = (filePath) => {
  const stats = fs.statSync(filePath)
  return stats.size
}

const getDisplayFileDuration = (file) => {
  if (file.durationInSecond < 0) {
    return '-'
  }
  let date = new Date(0)
  date.setSeconds(file.durationInSecond)
  return date.toISOString().substr(11, 8)
}

const getDisplayTimestamp = (file) => {
  return moment.parseZone(file.timestamp).format('YYYY-MM-DD HH:mm:ss')
}

const getDisplayFileSize = (file) => {
  const bytes = file.sizeInByte
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Byte'
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

const getUtcTimestamp = (file) => {
  if (file.timestamp.substr(-1) === 'Z' || file.timestamp.substr(-6, 1) === '-' || file.timestamp.substr(-6, 1) === '+') {
    return moment.utc(file.timestamp).toISOString() // timezone is in the parsed timestamp
  }
  if (Number.isInteger(parseInt(file.timezone))) {
    return moment.utc(file.timestamp).utcOffset(parseInt(file.timezone), true)
  }
  if (!file.timezone || file.timezone === FileTimezoneHelper.fileTimezone.UTC || file.timezone === '') {
    return file.timestamp + 'Z' // assume file that doesn't have timezone provided is in UTC)
  }
  return moment.tz(file.timestamp, file.timezone).toISOString() // parse with timezone and return as UTC
}

const getFileDuration = async (filePath) => {
  try {
    const fileInfo = await new FileInfo(filePath)
    if (!fileInfo.duration || fileInfo.duration === 0) {
      throw new Error('No duration found!')
    }
    return fileInfo.duration
  } catch (error) {
    throw error
  }
}

const isSupportedFileExtension = (fileExtension) => {
  let extension = fileExtension.toLowerCase()
  return ['wav', 'opus', 'flac'].includes(extension)
}

const isOutdatedFile = (file) => {
  return file.uploadedTime && Date.now() - parseInt(file.uploadedTime) > dayInMs * 30
}

// keep retring for preventing EPREM error (https://stackoverflow.com/questions/39293636/npm-err-error-eperm-operation-not-permitted-rename/45840283)
const rename = (path, newPath, maxRetires) => new Promise((resolve, reject) => {
  fs.rename(path, newPath, e => {
    if (e && (e.code === 'EACCES' || e.code === 'EPERM') && maxRetires > 0) {
      maxRetires--
      return rename(path, newPath, maxRetires).then(resolve).catch(reject)
    } else if (e) {
      reject(e)
    } else {
      resolve(newPath)
    }
  })
})

const getTempPath = (tmpPath, fileName, streamId) => {
  return `${tmpPath}/${fileName}-${streamId}`
}

const convert = (sourceFile, tempPath, streamId) => {
  const destinationPath = `${getTempPath(tempPath, getFileNameFromFilePath(sourceFile), streamId)}.flac`
  console.log('converting: ', sourceFile, destinationPath)
  return audioService.convert(sourceFile, destinationPath)
}

const remove = (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) {
        console.error(err)
        reject(err)
      } else {
        resolve('file delete successfully')
      }
    })
  })
}

const archiverDirectory = (sourceDirectory, targetFileName) => {
  var output = fs.createWriteStream(`${targetFileName}.zip`)
  var archive = archiver('zip')

  output.on('close', function () {
    console.log(archive.pointer() + ' total bytes')
    console.log('archiver has been finalized and the output file descriptor has closed.')
  })

  archive.on('error', function (err) {
    throw err
  })

  archive.pipe(output)

  // append files from a sub-directory, putting its contents at the root of archive
  archive.directory(sourceDirectory, false)

  // append files from a sub-directory and naming it `new-subdir` within the archive
  archive.directory('subdir/', 'new-subdir')

  archive.finalize()
}

export default {
  getFilesFromDirectoryPath,
  readFile,
  isExist,
  getFilePath,
  getFileNameFromFilePath,
  getDirectoryFromFilePath,
  getFileName,
  getExtension,
  getFileSize,
  getDisplayFileDuration,
  getDisplayTimestamp,
  getDisplayFileSize,
  getUtcTimestamp,
  getFileDuration,
  isSupportedFileExtension,
  isFolder,
  getCheckSum,
  isOutdatedFile,
  rename,
  convert,
  remove,
  archiverDirectory
}
