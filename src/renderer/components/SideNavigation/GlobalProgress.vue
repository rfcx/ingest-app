<template>
  <div class="global-progress__content-wrapper" v-if="shouldShowProgress" :class="shouldShowProgress ? '' : 'hidden'">
    <progress class="progress is-success global-progress__progress-bar" :value="getProgressPercent()" max="100"></progress>
    <div class="global-progress__content">
      <div class="global-progress__text-wrapper">
        <div class="global-progress__progress-title">Uploading</div>
        <div class="global-progress__progress-subtitle is-size-7">{{getState()}}</div>
      </div>
      <a class="global-progress__button" :title="isUploadingProcessEnabled ? 'Pause uploading process' : 'Continue uploading process'"
        href="#" @click="toggleUploadingProcess()" style="padding-right: 0.25rem"><img class="side-menu-controls-btn"
        :src="getUploadingProcessIcon(isUploadingProcessEnabled)"></a>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import File from '../../store/models/File'
export default {
  data () {
    return {
      isUploadingProcessEnabled: true
    }
  },
  computed: {
    ...mapState({
      currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId
    }),
    shouldShowProgress () {
      const allFiles = this.getAllFilesInTheSession()
      return allFiles.length !== allFiles.filter(file => file.isInCompletedGroup).length
    },
    completedFiles () {
      const files = this.getAllFilesInTheSession()
      return files.filter(f => f.isInCompletedGroup)
    },
    isUploadingEnabled () {
      const files = this.getAllFilesInTheSession()
      return files.every(file => { return !file.paused })
    }
  },
  watch: {
    isUploadingEnabled (val, oldVal) {
      if (val === oldVal) return
      this.isUploadingProcessEnabled = val
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
      this.isUploadingProcessEnabled = !this.isUploadingProcessEnabled
      const files = this.getAllFilesInTheSession()
      files.forEach(file => {
        File.update({ where: file.id,
          data: { paused: !this.isUploadingProcessEnabled }
        })
      })
    },
    getProgressPercent () {
      const files = this.getAllFilesInTheSession()
      if (!files.length || !this.completedFiles.length) return 0
      else return ((this.completedFiles.length / files.length) * 100)
    }
  }
}
</script>

<style lang="scss" scoped>
  .global-progress {
    &__content-wrapper {
      padding: 0 0 16px;
      position: absolute;
      left: 0;
      bottom: 0;
      width: $sidebar-width;
      height: $global-progress-height;
      background: #232436;
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
