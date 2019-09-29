const state = {
  files: []
}

const mutations = {
  addFile (state, file) {
    state.files.push(file)
  }
}

const actions = {
  ADD_FILE ({ commit }, file) {
    commit('ADD_FILE', file)
  }
}

export default {
  state,
  actions,
  mutations
}
