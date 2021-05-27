const getStatePriority = function (state) {
  switch (state) {
    case 'preparing': return 0
    case 'converting':
    case 'uploading': return 1
    case 'local_error':
    case 'server_error': return 2
    case 'duplicated': return 2
    case 'waiting': return 3
    case 'ingesting': return 4
    case 'completed': return 7
  }
}

const getSummaryStatePriority = function (state) {
  switch (state) {
    case 'ingesting': return 0
    case 'completed': return 10
    case 'local_error':
    case 'server_error': return 20
    default: return 30
  }
}

const getName = function (state, message) {
  switch (state) {
    case 'preparing': return ''
    case 'converting': return 'compressing'
    case 'waiting': return 'waiting'
    case 'uploading': return 'uploading'
    case 'ingesting': return 'verified'
    case 'local_error':
    case 'server_error':
      // if (!message) return ''
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
    case 'converting':
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

const preparedGroup = ['preparing', 'local_error']
const queuedGroup = ['waiting', 'uploading', 'converting']
const completedGroup = ['completed', 'ingesting', 'server_error', 'failed']

const isInPreparedGroup = function (state) {
  return preparedGroup.includes(state)
}

const isInQueuedGroup = function (state) {
  return queuedGroup.includes(state)
}

const isInCompletedGroup = function (state) {
  return completedGroup.includes(state)
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

const isServerError = function (state) {
  return state === 'server_error'
}

const isError = function (state) {
  return state.includes('error') || state === 'failed'
}

const isProcessing = function (state) {
  return state === 'ingesting'
}

const isDuplicated = function (state) {
  return state === 'duplicated'
}

const isCompleted = function (state) {
  return state === 'completed'
}

const canRedo = function (state, message) {
  if (!message) return false
  return ['failed', 'server_error'].includes(state) && !['duplicate', 'corrupt'].includes(message.toLowerCase())
}

const canRemove = function (state) {
  return isError(state) || isInPreparedGroup(state)
}

const canChangeTimestampFormat = function (state, message) {
  return isInPreparedGroup(state) && !(message.toLowerCase().includes('extension') || message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('duration'))
}

export default {
  preparedGroup,
  queuedGroup,
  completedGroup,
  getStatePriority,
  getSummaryStatePriority,
  getName,
  getIconName,
  isInPreparedGroup,
  isInQueuedGroup,
  isInCompletedGroup,
  isPreparing,
  isWaiting,
  isLocalError,
  isServerError,
  isError,
  isProcessing,
  isDuplicated,
  isCompleted,
  canRedo,
  canRemove,
  canChangeTimestampFormat
}
