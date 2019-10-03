const state = {
  selectedStreamId: ''
}

const mutations = {
  SET_SELECTED_STREAM_ID (state, streamId) {
    state.selectedStreamId = streamId
  }
}

const actions = {
  setSelectedStreamId ({ commit }, streamId) {
    commit('SET_SELECTED_STREAM_ID', streamId)
  }
}

export default {
  state,
  actions,
  mutations
}
