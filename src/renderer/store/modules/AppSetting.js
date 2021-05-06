const state = {
  selectedTabs: {},
  selectedStreamId: '',
  currentUploadingSessionId: null,
  isUploadingProcessEnabled: true
}

const mutations = {
  SET_SELECTED_TAB (state, tabObject) {
    state.selectedTabs = Object.assign({}, state.selectedTabs, tabObject)
  },
  SET_SELECTED_STREAM_ID (state, streamId) {
    state.selectedStreamId = streamId
  },
  SET_UPLOADING_SESSION_ID (state, id) {
    state.currentUploadingSessionId = id
  },
  ENABLE_UPLOADING_PROCESS (state, enabled) {
    state.isUploadingProcessEnabled = enabled
  },
  RESET (state) {
    state.selectedTabs = {}
    state.currentUploadingSessionId = null
    state.isUploadingProcessEnabled = true
    state.selectedStreamId = null
  }
}

const actions = {
  setSelectedTab ({ commit }, tabObject) {
    commit('SET_SELECTED_TAB', tabObject)
  },
  setSelectedStreamId ({ commit }, streamId) {
    commit('SET_SELECTED_STREAM_ID', streamId)
  },
  setCurrentUploadingSessionId ({ commit }, id) {
    commit('SET_UPLOADING_SESSION_ID', id)
  },
  enableUploadingProcess ({ commit }, enabled) {
    commit('ENABLE_UPLOADING_PROCESS', enabled)
  },
  reset ({ commit }) {
    commit('RESET')
  }
}

const getters = {
  getSelectedTabByStreamId: state => streamId => state.selectedTabs[streamId]
}

export default {
  state,
  actions,
  mutations,
  getters
}
