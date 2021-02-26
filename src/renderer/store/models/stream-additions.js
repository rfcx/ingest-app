
function incrementStreamCount (state, { streamId, countName, amount }) {
  if (state.data[streamId]) {
    state.data[streamId][countName] = state.data[streamId][countName] + amount
  }
}

function decrementStreamCount (state, { streamId, countName, amount }) {
  if (state.data[streamId]) {
    state.data[streamId][countName] = state.data[streamId][countName] - amount
  }
}

function resetAllSessionCounts (state) {
  for (const key of Object.keys(state.data)) {
    state.data[key].sessionSuccessCount = 0
    state.data[key].sessionFailCount = 0
    state.data[key].sessionTotalCount = 0
  }
}

function filesRemovedFromPreparing (context, { streamId, amount }) {
  return new Promise((resolve) => {
    context.commit('decrementStreamCount', { streamId, amount, countName: 'preparingCount' })
    resolve()
  })
}

function filesAddedToUploadSession (context, { streamId, amount }) {
  return new Promise((resolve) => {
    context.commit('decrementStreamCount', { streamId, amount, countName: 'preparingCount' })
    context.commit('incrementStreamCount', { streamId, amount, countName: 'sessionTotalCount' })
    resolve()
  })
}

function filesCompletedUploadSession (context, { streamId, amount, success }) {
  return new Promise((resolve) => {
    context.commit('incrementStreamCount', { streamId, amount, countName: success ? 'sessionSuccessCount' : 'sessionFailCount' })
    resolve()
  })
}

function resetSession (context) {
  return new Promise((resolve) => {
    context.commit('resetAllSessionCounts')
    resolve()
  })
}

export default {
  state: {},
  mutations: { incrementStreamCount, decrementStreamCount, resetAllSessionCounts },
  actions: { filesRemovedFromPreparing, filesAddedToUploadSession, filesCompletedUploadSession, resetSession }
}
