const state = {
  selectedTabs: {},
  currentUploadingSessionId: null
}

const mutations = {
  SET_SELECTED_TAB (state, tabObject) {
    state.selectedTabs = Object.assign({}, state.selectedTabs, tabObject)
  },
  SET_UPLOADING_SESSION_ID (state, id) {
    state.currentUploadingSessionId = id
  },
  RESET (state, object) {
    state.selectedTabs = object
  }
}

const actions = {
  setSelectedTab ({ commit }, tabObject) {
    commit('SET_SELECTED_TAB', tabObject)
  },
  setCurrentUploadingSessionId ({ commit }, id) {
    commit('SET_UPLOADING_SESSION_ID', id)
  },
  reset ({ commit }, object) {
    commit('RESET', object)
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
