const state = {
  selectedTabs: {},
  selectedTimezones: {},
  audiomothTimezoneOffsetConfigs: {},
  selectedStreamId: '',
  currentUploadingSessionId: null,
  isUploadingProcessEnabled: true
}

const mutations = {
  SET_SELECTED_TAB (state, tabObject) {
    state.selectedTabs = Object.assign({}, state.selectedTabs, tabObject)
  },
  SET_SELECTED_TIMEZONE (state, timezoneObject) {
    state.selectedTimezones = Object.assign({}, state.selectedTimezones, timezoneObject)
  },
  SET_AUDIOMOTH_CONFIGURED_TIMEZONE (state, timezoneOffsetObject) {
    state.audiomothTimezoneOffsetConfigs = Object.assign({}, state.audiomothTimezoneOffsetConfigs, timezoneOffsetObject)
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
    state.selectedTimezones = {}
    state.audiomothTimezoneOffsetConfigs = {}
  }
}

const actions = {
  setSelectedTab ({ commit }, tabObject) {
    commit('SET_SELECTED_TAB', tabObject)
  },
  setSelectedTimezone ({ commit }, timezoneObject) {
    commit('SET_SELECTED_TIMEZONE', timezoneObject)
  },
  setAudiomothTimezoneOffsetConfigs ({ commit }, timezoneOffsetObject) {
    commit('SET_AUDIOMOTH_CONFIGURED_TIMEZONE', timezoneOffsetObject)
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
  getSelectedTabByStreamId: state => streamId => state.selectedTabs[streamId],
  getSelectedTimezoneByStreamId: state => streamId => state.selectedTimezones[streamId],
  getAudiomothTimezoneOffsetConfigByStreamId: state => streamId => state.audiomothTimezoneOffsetConfigs[streamId]
}

export default {
  state,
  actions,
  mutations,
  getters
}
