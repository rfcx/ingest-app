const state = {
  selectedStream: {}
}

const mutations = {
  SET_SELECTED_STREAM (state, stream) {
    state.selectedStream = stream
  }
}

const actions = {
  setSelectedStream ({ commit }, stream) {
    commit('SET_SELECTED_STREAM', stream)
  }
}

export default {
  state,
  actions,
  mutations
}
