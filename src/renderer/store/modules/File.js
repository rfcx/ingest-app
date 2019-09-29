const state = {
  files: []
}

const mutations = {
  ADD_FILE (state, file) {
    state.files.push(file)
  }
}

const actions = {
  addFile ({ commit }, file) {
    commit('ADD_FILE', file)
  }
}

export default {
  state,
  actions,
  mutations
}
