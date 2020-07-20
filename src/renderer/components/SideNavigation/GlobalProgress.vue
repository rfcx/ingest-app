<template>
  <div class="global-progress__content-wrapper" v-if="shouldShowProgress" :class="shouldShowProgress ? '' : 'hidden'">
    <div class="global-progress__text-wrapper">
      <div class="global-progress__progress-title">Uploading</div>
      <div class="global-progress__progress-subtitle is-size-7">{{getState()}}</div>
    </div>
    <a class="global-progress__button" :title="isUploadingProcessEnabled ? 'Pause uploading process' : 'Continue uploading process'" href="#" @click="toggleUploadingProcess()" style="padding-right: 0.25rem"><img class="side-menu-controls-btn" :src="getUploadingProcessIcon(this.isUploadingProcessEnabled)"></a>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import File from '../../store/models/File'
export default {
  computed: {
    ...mapState({
      isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess,
      currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId
    }),
    shouldShowProgress () {
      const allFiles = this.getAllFilesInTheSession()
      return allFiles.length !== allFiles.filter(file => file.isInCompletedGroup).length
    },
    completedFiles () {
      const files = this.getAllFilesInTheSession()
      return files.filter(f => f.isInCompletedGroup)
    }
  },
  methods: {
    getAllFilesInTheSession () {
      return File.query().where('sessionId', this.currentUploadingSessionId).get()
    },
    getState () {
      const files = this.getAllFilesInTheSession()
      const completed = this.completedFiles.length
      const error = files.filter(f => f.isError).length
      const total = files.length
      let text = `${completed}/${total} files`
      text += error > 0 ? ` ${error} ${error <= 1 ? 'error' : 'errors'}` : ''
      return text
    },
    getUploadingProcessIcon (enabled) {
      const state = enabled ? 'pause' : 'play'
      return require(`../../assets/ic-uploading-${state}-green.svg`)
    },
    toggleUploadingProcess () {
      this.$store.dispatch('setUploadingProcess', !this.isUploadingProcessEnabled)
    }
  }
}
</script>

<style lang="scss">
  .global-progress {
    &__content-wrapper {
      display: flex;
      padding: 16px;
      justify-content: space-between;
      align-items: center;
      border-top: 0.5px solid rgba(83, 86, 110, .6);
      position: absolute;
      left: 0;
      bottom: 0;
      width: $sidebar-width;
      height: $global-progress-height;
      background: #232436;
    }
    &__progress-title {
      font-weight: $title-font-weight;
    }
    &__button {
      margin: auto 0;
    }
  }
  .hidden {
    display: none;
      height: 0;
  }
</style>