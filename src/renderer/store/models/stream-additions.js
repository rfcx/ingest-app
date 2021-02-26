
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

export default {
  state: {},
  mutations: { incrementStreamCount, decrementStreamCount },
  actions: { filesAddedToUploadSession, filesCompletedUploadSession }
}
