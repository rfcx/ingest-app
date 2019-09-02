/*

A checkin is the upload of a single audio file together with some meta data including
the timestamp of when the audio is recorded. Therefore these scripts require you to provide
a timestamp for each file, which must be given in the filename.

*/
const fs = require('fs')
const zlib = require('zlib')
const moment = require('moment')
const cryptoJS = require('crypto-js')
const sox = require('sox')
const querystring = require('querystring')

const debugLog = true
const path = '/Users/nui/Documents/Work/RFCx/Developments/rfcx-guardian-cli-master/tmp/'

// const apiHostName = 'https://api.rfcx.org'
// const apiToken = 'y'
// const guardianGuid = 'x'

// const fileName = ''
// const dateTimeISO = getDateTime(filename)
// // const SENT_AT_EPOCH

// const checkInJson = {
//   audio: '$SENT_AT_EPOCH*$DATETIME_EPOCH*$CODEC_FINAL*$AUDIO_FINAL_SHA1*$AUDIO_SAMPLE_RATE*1*$CODEC_FINAL*vbr*1*${AUDIO_SAMPLE_PRECISION}bit',
//   queued_at: '',
//   measured_at: '',
//   software: '',
//   battery: '',
//   queued_checkins: 1,
//   skipped_checkins: 0,
//   stashed_checkins: 0
// }

// TODO: json gzip https://github.com/Stuk/jszip/issues/164

// TODO: call the api to upload file

// TODO: get filename as a parameter (2019-06-01-14:05:30.opus, %YYY-%m-%d-%H:%M:%S) and do the logic to return datetime back
function getDateTime (fileName, timeStampFormat) {
  console.log('filename: ' + fileName + ' timestamp format: ' + timeStampFormat)

  const stringOffsetYear = timeStampFormat.search('%Y')
  const stringOffsetMonth = timeStampFormat.search('%m')
  const stringOffsetDay = timeStampFormat.search('%d')
  const stringOffsetHour = timeStampFormat.search('%H')
  const stringOffsetMin = timeStampFormat.search('%M')
  const stringOffsetSec = timeStampFormat.search('%S')
  const year = fileName.substr(stringOffsetYear, 4)
  const month = fileName.substr(stringOffsetMonth, 2)
  const day = fileName.substr(stringOffsetDay, 2)
  const hour = fileName.substr(stringOffsetHour, 2)
  const min = fileName.substr(stringOffsetMin, 2)
  const sec = fileName.substr(stringOffsetSec, 2)

  print(stringOffsetYear + '=' + year)
  print(stringOffsetMonth + '=' + month)
  print(stringOffsetDay + '=' + day)
  print(stringOffsetHour + '=' + hour)
  print(stringOffsetMin + '=' + min)
  print(stringOffsetSec + '=' + sec)

  // add milli sec
  const milliSeconds = 0

  // add timezone offset
  // TODO: check pref timestamp
  const timezoneOffset = '+0000'

  const dateTimeISO = year + '-' + month + '-' + day + 'T' + hour + ':' + min + ':' + sec + '.' + milliSeconds + timezoneOffset
  console.log('date iso: ' + dateTimeISO)
  return dateTimeISO
}

function getCodecFinal (fileName) {
  const codecOriginal = fileName.split('.').slice(-1)[0]
  return codecOriginal === 'wav' ? 'flac' : codecOriginal
}

function getAudioFinalSha1 (filePath) {
  const fileContent = fs.readFileSync(filePath)
  const fileWordArray = cryptoJS.lib.WordArray.create(fileContent)
  const audioFinalSha1 = cryptoJS.SHA1(fileWordArray)
  return audioFinalSha1
}

function identifyAudioFile (fileName) {
  return new Promise((resolve, reject) => {
    sox.identify(fileName, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
      /* results looks like:
      {
        format: 'wav',
        duration: 1.5,
        sampleCount: 66150,
        channelCount: 1,
        bitRate: 722944,
        sampleRate: 44100,
      }
      */
    })
  })
}

async function generateJSON (fileName, timeStampFormat) {
  const dateTimeISO = getDateTime(fileName, timeStampFormat) // LINE 61
  const dateEpoch = moment(dateTimeISO).unix() * 1000 // LINE 62
  const sentAtEpoch = moment().unix() // LINE 98
  const codecFinal = getCodecFinal(fileName) // LINE 39
  const audioFinalFilePath = path + dateEpoch + '.' + codecFinal // LINE 64
  const audioAudioFinalSha1 = getAudioFinalSha1(audioFinalFilePath)

  try {
    var result = await identifyAudioFile(path + fileName)
  } catch (error) {
    print(error)
    return
  }

  const audioElement = [sentAtEpoch, dateEpoch, codecFinal,
    audioAudioFinalSha1, result.sampleRate, '1', codecFinal,
    'vbr', '1', '16bit']

  print('dateEpoch: ' + dateEpoch)
  print('sentAtEpoch: ' + sentAtEpoch)
  print('codecFinal: ' + codecFinal)
  print('audioFinalFilePath: ' + audioFinalFilePath)
  print('audioAudioFinalSha1: ' + audioAudioFinalSha1)
  print('audioSampleRate: ' + result.sampleRate)

  // TODO: add LAT_LNG_JSON from LINE 102-108
  const checkInJson = {
    audio: audioElement.join('*'),
    queued_at: sentAtEpoch,
    measured_at: sentAtEpoch,
    software: 'guardian-cli*0.1.0|updater-cli*0.1.0',
    battery: sentAtEpoch + '*100*0',
    queued_checkins: 1,
    skipped_checkins: 0,
    stashed_checkins: 0
  }

  return checkInJson
}

// gzip
function getGZippedJSON (json) {
  const jsonStr = JSON.stringify(json)
  // const jsonStr = '{"audio":"1566904446322*1548246896000*mp3*e3ecd8549ef9e973f20b23e342816fa284a8cbc9*12000*1*mp3*vbr*1*16bit","queued_at":1566904446322,"measured_at":1566904446322,"software":"guardian-cli*0.1.0|updater-cli*0.1.0","battery":"1566904446322*100*0","queued_checkins":"1","skipped_checkins":"0","stashed_checkins":"0"}'
  return new Promise((resolve, reject) => {
    zlib.gzip(jsonStr, (error, gzip) => {
      if (error) reject(error)
      const base64 = Buffer.from(gzip, 'ascii').toString('base64')
      const hexdump = Buffer.from(base64).toString('hex')
      const hexArray = hexdump.match(/.{1,2}/g)
      const sed = '%' + hexArray.join('%')
      print('base64: ' + base64)
      print('hexdump: ' + hexdump)
      print('sed: ' + sed)
      resolve(sed)
    })
  })
}

function unzip (gZippedJson) {
  const a = querystring.parse('gzipped=' + gZippedJson)
  print(a)
  zlib.unzip(
    Buffer.from(querystring.parse('gzipped=' + gZippedJson).gzipped, 'base64'),
    function (zLibError, zLibBuffer) {
      if (!zLibError) {
        print(JSON.parse(zLibBuffer.toString()))
      } else {
        if (zLibError) {
          print(zLibError)
        }
      }
    })
}

function print (any) {
  if (debugLog) console.log(any)
}
// js unzip('%48%34%73%49%41%41%41%41%41%41%41%41%45%32%32%50%79%51%34%43%49%52%42%45%2f%34%55%6a%55%63%4d%32%43%50%4d%7a%70%6f%45%65%4a%57%34%6a%69%38%61%6f%2f%79%37%6a%78%62%6a%63%4f%71%2b%72%55%6c%55%33%41%6a%58%45%49%2b%6b%4a%37%37%53%32%54%43%6d%6c%70%52%43%55%64%38%6f%49%70%59%33%56%6a%44%47%36%48%79%56%46%69%54%36%59%54%6c%6b%63%4c%4e%71%6c%48%41%52%7a%51%71%4a%55%77%6e%41%39%67%44%41%4b%6a%48%66%65%55%69%34%6d%43%33%2b%5a%7a%69%36%31%69%32%73%58%43%35%6d%52%55%38%57%4b%59%51%57%46%39%42%39%70%4d%37%4a%48%79%44%58%39%2f%2b%58%6a%55%43%36%51%73%48%56%63%56%30%67%68%77%6d%48%75%64%35%47%79%42%56%2b%77%65%78%30%44%46%45%78%76%30%6e%49%63%6c%49%61%75%76%36%4e%61%4c%2f%62%75%34%54%66%6f%74%2f%47%51%4a%31%32%6a%65%52%76%48%38%52%4e%50%34%6c%77%67%62%37%37%78%34%77%6d%51%72%47%52%38%4f%41%45%41%41%41%3d%3d')
// batch unzip('%48%34%73%49%41%48%34%51%5a%56%30%41%41%32%32%50%79%51%34%43%49%52%42%45%2f%34%55%6a%55%63%4d%32%43%50%4d%7a%70%6f%45%65%4a%57%34%6a%69%38%61%6f%2f%79%37%6a%78%62%6a%63%4f%71%2b%72%55%6c%55%33%41%6a%58%45%49%2b%6b%4a%37%37%53%32%54%43%6d%6c%70%52%43%55%64%38%6f%49%70%59%33%56%6a%44%47%36%48%79%56%46%69%54%36%59%54%6c%6b%63%4c%4e%71%6c%48%41%52%7a%51%71%4a%55%77%6e%41%39%67%44%41%4b%6a%48%66%65%55%69%34%6d%43%33%2b%5a%7a%69%36%31%69%32%73%58%43%35%6d%52%55%38%57%4b%59%51%57%46%39%42%39%70%4d%37%4a%48%79%44%58%39%2f%2b%58%6a%55%43%36%51%73%48%56%63%56%30%67%68%77%6d%48%75%64%35%47%79%42%56%2b%77%65%78%30%44%46%45%78%76%30%6e%49%63%6c%49%61%75%76%36%4e%61%4c%2f%62%75%34%54%66%6f%74%2f%47%51%4a%31%32%6a%65%52%76%48%38%52%4e%50%34%6c%77%67%62%37%37%78%34%77%6d%51%72%47%52%38%4f%41%45%41%41%41%3d%3d%0a')
unzip('%48%34%73%49%41%41%41%41%41%41%41%41%45%32%32%50%53%77%34%43%49%52%42%45%37%38%4b%53%71%47%6b%2b%67%2b%42%6c%54%41%4d%39%53%76%79%4e%44%47%69%4d%65%6e%66%52%7a%55%54%6a%72%76%4d%71%6c%56%64%39%5a%31%68%6a%4f%72%45%56%45%35%30%78%44%71%79%56%6b%6f%74%4f%57%36%6d%4e%64%51%59%41%2b%47%46%51%6e%42%53%46%61%44%76%74%71%48%66%6b%6c%71%71%58%34%4b%55%69%70%61%55%56%70%6b%64%70%4e%64%72%67%67%2b%4e%43%76%69%76%69%55%37%72%34%33%43%35%68%66%43%70%73%78%73%36%56%4b%73%55%31%46%72%61%61%56%44%4e%32%49%42%78%72%2f%68%4f%4d%70%37%35%63%4d%56%4f%62%74%71%6d%59%59%38%4c%6a%50%4f%77%54%68%34%56%59%77%4b%4d%4f%45%51%76%6c%69%54%53%44%78%39%4c%51%37%65%65%58%4e%67%63%6d%66%64%68%53%32%4b%58%6a%32%46%78%4e%73%55%76%44%38%41%57%68%77%59%4c%6a%39%68%73%2b%58%35%37%59%4e%71%73%6d%41%51%41%41')
generateJSON('20190123_123456.mp3', '%YYY%m%d_%H%M%S')
  .then(json => {
    print(JSON.stringify(json))
    print(getGZippedJSON(json))
  }).catch(err => {
    print(err)
  })
