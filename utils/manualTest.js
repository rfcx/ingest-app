const fileState = require('./fileState')

const stateIds = fileState.mapPossibleStatesWithId()
console.log('stateid', stateIds)
const statements = Object.entries(stateIds).map(s => {
  const [key, values] = s
  return `UPDATE files SET status=${parseInt(key)} WHERE status IN (${values.join()})`
})
console.log(statements)
