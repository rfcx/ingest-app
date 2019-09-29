const state = {
  selectedStream: {},
  streams: []
}

const mutations = {
  SET_SELECTED_STREAM (state, stream) {
    state.selectedStream = stream
  },
  ADD_STREAM (state, stream) {
    state.streams.push(stream)
  }
}

const actions = {
  setSelectedStream ({ commit }, stream) {
    commit('SET_SELECTED_STREAM', stream)
  },
  addStream ({ commit }, stream) {
    commit('ADD_STREAM', stream)
  }
}

export default {
  state,
  actions,
  mutations
}
