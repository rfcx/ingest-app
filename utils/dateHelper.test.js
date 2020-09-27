const dateHelper = require('./dateHelper')
const moment = require('moment')

test('YMDHIS is auto-detected', () => {
  const input = 'somethinghere-2020-12-11-10:09:08.flac'
  const expected = '2020-12-11T10:09:08.000Z'
  const actual = dateHelper.getIsoDateWithFormat('Auto-detect', input)
  expect(actual).toBe(expected)
})

test('YMDHIS is detected with manual format', () => {
  const input = 'somethinghere-2020-12-11-10:09:08.flac'
  const expected = '2020-12-11T10:09:08.000Z'
  const actual = dateHelper.getIsoDateWithFormat('%Y-%M-%D-%H:%I:%S', input)
  expect(actual).toBe(expected)
})

test('YMDHIS without delimeters is detected with manual format', () => {
  const input = 'prefix20201112100908.flac'
  const expected = '2020-12-11T10:09:08.000Z'
  const actual = dateHelper.getIsoDateWithFormat('%Y%D%M%H%I%S', input)
  expect(actual).toBe(expected)
})

test('YDMHIS is detected with manual format', () => {
  const input = 'somethinghere-2020-11-12-10:09:08.flac'
  const expected = '2020-12-11T10:09:08.000Z'
  const actual = dateHelper.getIsoDateWithFormat('%Y-%D-%M-%H:%I:%S', input)
  expect(actual).toBe(expected)
})

test('ymdhis is detected with manual format', () => {
  const input = 'somethinghere-19-7-2-8:9:6.flac'
  const expected = '2019-07-02T08:09:06.000Z'
  const actual = dateHelper.getIsoDateWithFormat('%y-%m-%d-%h:%i:%s', input)
  expect(actual).toBe(expected)
})

test('YDMGISA is detected with manual format', () => {
  const input = 'somethinghere-2020-11-12-10:09:08 PM.flac'
  const expected = '2020-12-11T22:09:08.000Z'
  const actual = dateHelper.getIsoDateWithFormat('%Y-%D-%M-%G:%I:%S %A', input)
  expect(actual).toBe(expected)
})

test('YDMGISa is detected with manual format', () => {
  const input = '2020 11 12 10 09 08 p.flac'
  const expected = '2020-12-11T22:09:08.000Z'
  const actual = dateHelper.getIsoDateWithFormat('%Y %D %M %G %I %S %a', input)
  expect(actual).toBe(expected)
})
