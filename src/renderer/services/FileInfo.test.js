const moment = require('moment')

function timezoneOffset (comment) {
  const reg = /\(UTC(?<symbol>[+-])(?:(?<h>\d{1,2}))(?::(?<m>\d{1,2}))?\)/ig
  try {
    const matched = reg.exec(comment)
    const symbol = matched.groups.symbol === '-' ? -1 : 1
    const hour = (parseFloat(matched.groups.h) || 0) * 60
    const min = (parseFloat(matched.groups.m) || 0)
    const total = (hour + min) * symbol
    return total
  } catch (e) {
    return 0
  }
}

function logTestResult (expected, actual, testCase) {
  const symbol = expected === actual ? '✅' : '💥'
  console.info(`${symbol} ${testCase} = ${expected} / ${actual}`)
}

function testTimezoneOffset (input, expected, testCaseName) {
  const actual = timezoneOffset(input)
  const g = moment().utcOffset(testCaseName).utcOffset()
  logTestResult(expected, actual, testCaseName, g)
}

testTimezoneOffset('(UTC-1)', -60, 'UTC-1')
testTimezoneOffset('(UTC+1)', 60, 'UTC+1')
testTimezoneOffset('(UTC+7)', 420, 'UTC+7')
testTimezoneOffset('(UTC+5:30)', 330, 'UTC+5:30')
testTimezoneOffset('(UTC+05:30)', 330, 'UTC+05:30')
testTimezoneOffset('(UTC+4:30)', 270, 'UTC+4:30')
testTimezoneOffset('(UTC+04:30)', 270, 'UTC+04:30')
testTimezoneOffset('(UTC+4:45)', 285, 'UTC+4:45')
testTimezoneOffset('(UTC-4:30)', -270, 'UTC-4:30')
testTimezoneOffset('(UTC-04:30)', -270, 'UTC-04:30')
testTimezoneOffset('(UTC-01:30)', -90, 'UTC-01:30')
testTimezoneOffset('(UTC-13:00)', -780, 'UTC-13:00')
testTimezoneOffset('(UTC)', 0, 'UTC')
testTimezoneOffset('(UTC+0)', 0, 'UTC+0')
