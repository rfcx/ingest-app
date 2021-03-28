import getAudioDurationInSeconds from './fileDurationHelper'
const fs = require('fs')
const path = require('path')
const cryptoJS = require('crypto-js')
const moment = require('moment-timezone')

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path.replace('app.asar', 'app.asar.unpacked')
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)

const dayInMs = 1000 * 60 * 60 * 24

const getFilePath = (directoryPath, fileName) => {
  return path.join(directoryPath, fileName)
}

const isExist = (path) => {
  return fs.existsSync(path)
}

const isFile = (filePath) => {
  return fs.lstatSync(filePath).isFile()
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

const getMD5Hash = (filePath) => {
  if (!isFile(filePath)) return ''
  const fileData = readFile(filePath)
  let fileWordArr = cryptoJS.lib.WordArray.create(fileData)
  let sha1Hash = cryptoJS.SHA1(fileWordArr)
  return {
    hash: cryptoJS.MD5(fileData).toString(),
    sha1: sha1Hash.toString()
  }
}

const getCheckSum = (filePath) => {
  const fileData = readFile(filePath)
  let fileWordArr = cryptoJS.lib.WordArray.create(fileData)
  let sha1Hash = cryptoJS.SHA1(fileWordArr)
  return sha1Hash.toString()
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
  return moment.parseZone(file.timestamp).format('YYYY-MM-DD HH:mm:ss Z')
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
  if (!file.timezone) {
    return file.timestamp + 'Z' // no timezone provided (assume UTC)
  }
  return moment.tz(file.timestamp, file.timezone).toISOString() // parse with timezone and return as UTC
}

const getFileDuration = (filePath) => {
  return getAudioDurationInSeconds(filePath)
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
  return new Promise((resolve, reject) => {
    const command = ffmpeg(sourceFile)
      .noVideo()
      .output(destinationPath)

    const timeout = setTimeout(function () {
      command.kill()
      reject(Error('Timeout')) // TODO: move to errors
    }, 60000)

    command
      .on('error', function (err, stdout, stderr) {
        clearTimeout(timeout)
        reject(err)
      })
      .on('end', async function (stdout, stderr) {
        clearTimeout(timeout)
        try {
          resolve({
            path: destinationPath
          })
        } catch (e) { reject(e) }
      })
      .run()
  })
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

export default {
  getFilesFromDirectoryPath,
  readFile,
  isExist,
  getMD5Hash,
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
  remove
}
