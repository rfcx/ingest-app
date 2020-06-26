const state = {
  selectedTab: null
}

const mutations = {
  SET_SELECTED_TAB (state, tab) {
    state.selectedTab = tab
  }
}

const actions = {
  setSelectedTab ({ commit }, tab) {
    commit('SET_SELECTED_TAB', tab)
  }
}

export default {
  state,
  actions,
  mutations
}
