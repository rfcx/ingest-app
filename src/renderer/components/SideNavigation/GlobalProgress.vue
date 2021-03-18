<template>
  <div class="wrapper__content-wrapper" v-if="shouldShowProgress" :class="shouldShowProgress ? '' : 'hidden'">
    <progress class="progress is-success wrapper__progress-bar" :value="getProgressPercent()" max="100"></progress>
    <div class="wrapper__content">
      <div class="wrapper__text-wrapper">
        <div class="wrapper__progress-title">Uploading</div>
        <div class="wrapper__progress-subtitle is-size-7">{{getState()}}</div>
      </div>
      <a class="wrapper__button" :title="isUploadingProcessEnabled ? 'Pause uploading process' : 'Continue uploading process'"
        href="#" @click="toggleUploadingProcess()" style="padding-right: 0.25rem"><img :src="getUploadingProcessIcon(isUploadingProcessEnabled)">
      </a>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import ipcRendererSend from '../../services/ipc'
export default {
  data () {
    return {
      numberOfAllFilesInTheSession: null,
      numberOfCompleteFilesInTheSession: null,
      numberOfSuccessFilesInTheSession: null,
      numberOfFailFilesInTheSession: null,
      shouldShowProgress: null,
      refreshInterval: null
    }
  },
  computed: {
    ...mapState({
      currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId,
      isUploadingProcessEnabled: state => state.AppSetting.isUploadingProcessEnabled
    })
  },
  watch: {
    isUploadingEnabled (val, oldVal) {
      if (val === oldVal) return
      this.isUploadingProcessEnabled = val
    }
  },
  methods: {
    async getStats () {
      const stats = await ipcRendererSend('db.streams.stats', `db.streams.stats.${Date.now()}`)
      this.numberOfAllFilesInTheSession = stats.sessionTotalCount
      this.numberOfSuccessFilesInTheSession = stats.sessionSuccessCount
      this.numberOfFailFilesInTheSession = stats.sessionFailCount
      this.numberOfCompleteFilesInTheSession = stats.sessionSuccessCount + stats.sessionFailCount
      this.shouldShowProgress = this.numberOfAllFilesInTheSession && this.numberOfCompleteFilesInTheSession && this.numberOfAllFilesInTheSession !== this.numberOfCompleteFilesInTheSession
    },
    getState () {
      const error = this.numberOfFailFilesInTheSession
      let text = `${this.numberOfSuccessFilesInTheSession}/${this.numberOfAllFilesInTheSession} files`
      text += error > 0 ? ` ${error} ${error <= 1 ? 'error' : 'errors'}` : ''
      return text
    },
    getUploadingProcessIcon (enabled) {
      const state = enabled ? 'pause' : 'play'
      return require(`../../assets/ic-uploading-${state}-green.svg`)
    },
    toggleUploadingProcess () {
      this.$store.dispatch('enableUploadingProcess', !this.isUploadingProcessEnabled)
    },
    async getProgressPercent () {
      if (!this.numberOfAllFilesInTheSession || !this.numberOfCompleteFilesInTheSession) return 0
      else return ((this.numberOfCompleteFilesInTheSession / this.numberOfAllFilesInTheSession) * 100)
    }
  },
  created () {
    this.refreshInterval = setInterval(() => {
      if (this.isUploadingProcessEnabled) {
        this.getStats()
      }
    }, 1000)
  },
  beforeDestroy () {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    &__content-wrapper {
      padding: 0 0 16px;
      position: absolute;
      left: 0;
      bottom: 0;
      width: $sidebar-width;
      height: $global-progress-height;
      background: $side-menu-background;
    }
    &__content {
      display: flex;
      padding: 9px 16px 0;
      justify-content: space-between;
      align-items: center;
    }
    &__progress-title {
      font-weight: $title-font-weight;
    }
    &__button {
      margin: auto 0;
      img {
        width: 17px;
      }
    }
    &__progress-bar {
      display: block;
      margin-top: 0 !important;
    }
  }
  .hidden {
    display: none;
      height: 0;
  }
</style>
