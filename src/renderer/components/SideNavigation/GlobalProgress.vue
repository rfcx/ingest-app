<template>
  <div class="wrapper__content-wrapper" v-if="shouldShowProgress" :class="shouldShowProgress ? '' : 'hidden'">
    <div class="progress">
      <div class="progress-bar completed" :style="{ width: completedFilesPercentage+'%' }"></div>
      <div class="progress-bar processing"  :style="{ width: processingFilesPercentage+'%' }"></div>
    </div>
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
import FileState from '../../../../utils/fileState'
import ipcRendererSend from '../../services/ipc'
export default {
  data () {
    return {
      numberOfAllFilesInTheSession: null,
      numberOfCompleteFilesInTheSession: null,
      numberOfSuccessFilesInTheSession: null,
      numberOfFailFilesInTheSession: null,
      numberOfProcessingFilesInTheSession: null,
      shouldShowProgress: null,
      refreshInterval: null
    }
  },
  computed: {
    ...mapState({
      currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId,
      isUploadingProcessEnabled: state => state.AppSetting.isUploadingProcessEnabled
    }),
    completedFilesPercentage () {
      if (!this.numberOfAllFilesInTheSession || !this.numberOfCompleteFilesInTheSession) return 0
      else return ((this.numberOfCompleteFilesInTheSession / this.numberOfAllFilesInTheSession) * 100)
    },
    processingFilesPercentage () {
      return this.numberOfProcessingFilesInTheSession / this.numberOfAllFilesInTheSession * 100
    }
  },
  watch: {
    isUploadingEnabled (val, oldVal) {
      if (val === oldVal) return
      this.isUploadingProcessEnabled = val
    }
  },
  methods: {
    async getStats () {
      if (!this.currentUploadingSessionId) {
        this.resetNumber()
        return
      }
      const stats = await ipcRendererSend('db.files.sessionCount', `db.files.sessionCount.${Date.now()}`, this.currentUploadingSessionId)
      this.numberOfAllFilesInTheSession = this.calculateNumberOfFiles('all', stats)
      this.numberOfSuccessFilesInTheSession = this.calculateNumberOfFiles('success', stats)
      this.numberOfFailFilesInTheSession = this.calculateNumberOfFiles('error', stats)
      this.numberOfProcessingFilesInTheSession = this.calculateNumberOfFiles('processing', stats)
      this.numberOfCompleteFilesInTheSession = this.numberOfSuccessFilesInTheSession + this.numberOfFailFilesInTheSession
      this.shouldShowProgress = (this.numberOfAllFilesInTheSession !== this.numberOfCompleteFilesInTheSession) || this.numberOfProcessingFilesInTheSession > 0
      if (this.numberOfCompleteFilesInTheSession === this.numberOfAllFilesInTheSession) {
        this.sendCompleteNotification(this.numberOfSuccessFilesInTheSession, this.numberOfFailFilesInTheSession)
        await this.$store.dispatch('setCurrentUploadingSessionId', null)
      }
    },
    getState () {
      const error = this.numberOfFailFilesInTheSession
      const processing = this.numberOfProcessingFilesInTheSession
      let text = `${processing + this.numberOfSuccessFilesInTheSession}/${this.numberOfAllFilesInTheSession} files`
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
    getProgressPercent () {
      if (!this.numberOfAllFilesInTheSession || !this.numberOfCompleteFilesInTheSession) return 0
      else return ((this.numberOfCompleteFilesInTheSession / this.numberOfAllFilesInTheSession) * 100)
    },
    calculateNumberOfFiles (group, stats) {
      let groupFileCount = []
      switch (group) {
        case 'error':
          groupFileCount = stats.filter(group => FileState.isServerError(group.state))
          break
        case 'success':
          groupFileCount = stats.filter(group => FileState.isCompleted(group.state))
          break
        case 'processing':
          groupFileCount = stats.filter(group => FileState.isProcessing(group.state))
          break
        case 'all':
          groupFileCount = stats
          break
      }
      return groupFileCount.map(s => s.stateCount).reduce((a, b) => a + b, 0)
    },
    sendCompleteNotification (numberOfCompletedFiles, numberOfFailedFiles) {
      const completedText = `${numberOfCompletedFiles} ${numberOfCompletedFiles > 1 ? 'files' : 'file'} uploaded`
      const failText = `${numberOfFailedFiles} ${numberOfFailedFiles > 1 ? 'files' : 'file'} failed`
      let notificationCompleted = {
        title: 'Ingest Completed',
        body: `${numberOfCompletedFiles > 0 ? completedText : ''} ${numberOfFailedFiles > 0 ? failText : ''}`
      }
      let myNotificationCompleted = new window.Notification(notificationCompleted.title, notificationCompleted)
      myNotificationCompleted.onshow = () => {
        console.log('show notification')
      }
    },
    resetNumber () {
      this.numberOfAllFilesInTheSession = 0
      this.numberOfSuccessFilesInTheSession = 0
      this.numberOfFailFilesInTheSession = 0
      this.numberOfCompleteFilesInTheSession = 0
      this.numberOfProcessingFilesInTheSession = 0
      this.shouldShowProgress = false
    }
  },
  created () {
    this.getStats()
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
  .progress {
    background-color: $progress-bar-background-color;
    width: 100%;
    height: 10px;
  }
  .progress-bar { float: left; }
  .progress-bar.completed {
    background-color: $brand-primary;
    height: 100%;
  }
  .progress-bar.processing {
    background-color: $brand-primary;
    opacity: 0.6;
    height: 100%;
  }
  .hidden {
    display: none;
      height: 0;
  }
</style>
