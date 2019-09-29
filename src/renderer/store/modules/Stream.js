const state = {
  selectedStream: {},
  streams: []
}

const actions = {
  SET_SELECTED_STREAM ({ commit }, stream) {
    console.log(stream)
    commit('SET_SELECTED_STREAM', stream)
  },
  ADD_STREAM ({ commit }, stream) {
    commit('ADD_STREAM', stream)
  }
}

const mutations = {
  SET_SELECTED_STREAM (state, stream) {
    console.log('SET_SELECTED_STREAM')
    state.selectedStream = stream
  },
  ADD_STREAM (state, stream) {
    state.streams.push(stream)
  }
}

export default {
  state,
  actions,
  mutations
}
