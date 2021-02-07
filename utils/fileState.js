const getStatePriority = function (state, message) {
  switch (state) {
    case 'preparing': return 0
    case 'waiting': return 3
    case 'uploading': return 1
    case 'ingesting': return 2
    case 'local_error': return 5
    case 'server_error':
      if (message && message.toLowerCase().includes('duplicate')) return 4
      else return 5
    case 'duplicated': return 6
    case 'completed': return 7
  }
}

const getName = function (state, message) {
  switch (state) {
    case 'preparing': return ''
    case 'waiting': return 'waiting'
    case 'uploading': return 'uploading'
    case 'ingesting': return 'ingesting'
    case 'local_error':
    case 'server_error':
      if (!message) return ''
      if (message && message.toLowerCase().includes('duplicate')) return 'duplicate'
      else return 'failed'
    case 'completed': return 'completed'
  }
}

const getIconName = function (state) {
  switch (state) {
    case 'preparing':
    case 'waiting':
      return 'ic-state-waiting.svg'
    case 'uploading':
    case 'uploaded':
      return 'ic-state-uploading.svg'
    case 'ingesting':
      return 'ic-state-ingesting.svg'
    case 'local_error':
    case 'server_error':
    case 'failed':
    case 'duplicated':
      return 'ic-state-failed.svg'
    case 'completed':
      return 'ic-state-completed.svg'
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

const isLocalError = function (state) {
  return state === 'local_error'
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
  if (!message) return false
  return (state === 'failed' || state === 'server_error') && !message.toLowerCase().includes('duplicate') && !message.toLowerCase().includes('corrupt')
}

const canRemove = function (state) {
  return isError(state) || isInPreparedGroup(state)
}

const canChangeTimestampFormat = function (state, message) {
  return isInPreparedGroup(state) && !(message.toLowerCase().includes('extension') || message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('duration'))
}

export default {
  getStatePriority,
  getName,
  getIconName,
  isInPreparedGroup,
  isInQueuedGroup,
  isInCompletedGroup,
  isPreparing,
  isWaiting,
  isLocalError,
  isError,
  isDuplicated,
  isCompleted,
  canRedo,
  canRemove,
  canChangeTimestampFormat
}
