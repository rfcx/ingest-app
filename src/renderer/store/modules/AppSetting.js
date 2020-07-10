const state = {
  selectedTabs: {}
}

const mutations = {
  SET_SELECTED_TAB (state, tabObject) {
    state.selectedTabs = Object.assign({}, state.selectedTabs, tabObject)
  }
}

const actions = {
  setSelectedTab ({ commit }, tabObject) {
    commit('SET_SELECTED_TAB', tabObject)
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
