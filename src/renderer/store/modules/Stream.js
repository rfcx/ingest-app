const state = {
  selectedStreamId: '',
  enableUploadingProcess: true
}

const mutations = {
  SET_SELECTED_STREAM_ID (state, streamId) {
    state.selectedStreamId = streamId
  },
  SET_UPLOADING_PROCESS (state, enabled) {
    state.enableUploadingProcess = enabled
  }
}

const actions = {
  setSelectedStreamId ({ commit }, streamId) {
    commit('SET_SELECTED_STREAM_ID', streamId)
  },
  setUploadingProcess ({ commit }, enabled) {
    commit('SET_UPLOADING_PROCESS', enabled)
  }
}

export default {
  state,
  actions,
  mutations
}
