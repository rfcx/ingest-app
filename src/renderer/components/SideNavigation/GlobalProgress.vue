<template>
  <div class="global-progress__content-wrapper" :class="shouldShowProgress ? '' : 'hidden'">
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
      isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess
    }),
    shouldShowProgress () {
      return this.uploadingFiles.length > 0
    },
    uploadingFiles () {
      const files = this.getAllFiles()
      return files.filter(f => f.state === 'uploading')
    },
    completedFiles () {
      const files = this.getAllFiles()
      return files.filter(f => f.state === 'ingested')
    }
  },
  methods: {
    getAllFiles () {
      return File.all()
    },
    getState () {
      const files = this.getAllFiles()
      console.log(files)
      const waiting = files.filter(f => f.state === 'waiting').length
      const uploading = this.uploadingFiles.length
      const completed = this.completedFiles.length
      const error = files.filter(f => f.state === 'failed' || f.state === 'duplicated').length
      const total = uploading + completed + waiting
      return `${completed}/${total} files ${error} ${error <= 1 ? 'error' : 'errors'}`
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

<style lang="scss" scoped>
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