const state = {
  selectedStream: {}
}

const actions = {
  SET_SELECTED_STREAM ({ commit }, stream) {
    console.log(stream)
    commit('SET_SELECTED_STREAM', stream)
  }
}

const mutations = {
  SET_SELECTED_STREAM (state, stream) {
    console.log('SET_SELECTED_STREAM')
    state.selectedStream = stream
  }
}

export default {
  state,
  actions,
  mutations
}
