const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path.replace('app.asar', 'app.asar.unpacked')
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)

/**
   * convert wav files to flac
   * @returns desination path of the converted file
   */
const convert = () => {}

/**
 * Probe an audio file to find its sample rate, duration and other meta data
 * - result: { format: 'wav', duration: 1.5, comment: 'Recorded at {DATE} {TIMEZONE} during deployment {DEPLOYMENT_ID} at {GAIN} setting while {BATTERY} and {TEMPERTURE}', artist: 'AudioMoth {DEVICE_ID}' }
 * @param {String} sourceFile - path to source file on disk
 * @returns {Promise<Object>} - an object containing the meta data
 */
const identify = (sourceFile) => {
  return new Promise((resolve, reject) => {
    ffmpeg(sourceFile)
      .ffprobe(0, function (err, result) {
        if (err) {
          console.log('identify err', err)
          reject(err)
        } else {
          console.log('identify stream', result)
          const format = result.format && result.format.format_name ? result.format.format_name : undefined
          const duration = result.format && parseFloat(result.format.duration)
          const tags = result.format.tags
          const artist = tags && tags.artist
          const comment = tags && tags.comment
          resolve({ format, duration, comment, artist })
        }
      })
  })
}

export default {
  convert,
  identify
}
