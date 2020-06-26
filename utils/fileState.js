const getStatePriority = function (state, message) {
  switch (state) {
    case 'preparing': return 0
    case 'waiting': return 1
    case 'uploading': return 2
    case 'ingesting': return 3
    case 'local_error': return 5
    case 'server_error':
      if (message.includes('duplicate')) return 4
      else return 5
    case 'duplicated': return 6
    case 'completed': return 7
  }
}

const isInPreparedGroup = function (state) {
  return state === 'preparing' || state === 'local_error'
}

const isInQueuedGroup = function (state) {
  return state === 'waiting' || state === 'uploading' || state === 'ingesting'
}

const isInCompletedGroup = function (state) {
  return state === 'completed' || state === 'server_error' || state === 'failed'
}

const isPreparing = function (state) {
  return state === 'preparing'
}

const isWaiting = function (state) {
  return state === 'waiting'
}

const isError = function (state) {
  return state.includes('error') || state === 'failed'
}

const isDuplicated = function (state) {
  return state === 'duplicated'
}

const isCompleted = function (state) {
  return state === 'completed'
}

const canRedo = function (state, message) {
  return (state === 'failed' || state === 'server_error') && !message.toLowerCase().includes('duplicate')
}

export default {
  getStatePriority,
  isInPreparedGroup,
  isInQueuedGroup,
  isInCompletedGroup,
  isPreparing,
  isWaiting,
  isError,
  isDuplicated,
  isCompleted,
  canRedo
}
