<template>
  <footer>
    <div class="global-progress__content-wrapper">
      <div class="global-progress__text-wrapper">
        <div class="global-progress__progress-title">uploading...</div>
        <div class="global-progress__progress-subtitle is-size-7">0/11</div>
      </div>
      <a class="global-progress__button" :title="isUploadingProcessEnabled ? 'Pause uploading process' : 'Continue uploading process'" href="#" @click="toggleUploadingProcess()" style="padding-right: 0.25rem"><img class="side-menu-controls-btn" :src="getUploadingProcessIcon(this.isUploadingProcessEnabled)"></a>
    </div>
  </footer>
</template>

<script>
import { mapState } from 'vuex'
export default {
  computed: {
    ...mapState({
      isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess
    })
  },
  methods: {
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
</style>