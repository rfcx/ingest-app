const state = {
  productionEnvironment: false
}

const mutations = {
  SET_ENVIRONMENT (state, production) {
    state.productionEnvironment = production
  }
}

const actions = {
  setEnvironment ({ commit }, production) {
    commit('SET_ENVIRONMENT', production)
  }
}

export default {
  state,
  actions,
  mutations
}
