<template>
  <div class="import-stream__wrapper">
    <header-view title="Import audio files from AudioMoth" />
    <p class="subtitle">Insert SD Card or choose the folder to import.</p>
    <source-list @sourceSelected="onSourceSelected"></source-list>
    <div class="field is-grouped">
      <p class="control control-btn">
        <router-link class="control-btn" to="/">
          <button type="button" class="button is-rounded is-cancel">Cancel</button>
        </router-link>
      </p>
      <p class="control control-btn">
        <button
          type="button"
          class="button is-rounded is-primary"
          :class="{ 'is-loading': isLoading }"
          :disabled="!selectedSource"
          @click.prevent="importFiles"
        >Import</button>
      </p>
    </div>
  </div>
</template>

<script>
import SourceList from './SourceList'
import Stream from '../../store/models/Stream'
import HeaderView from '../Common/HeaderWithBackButton'

export default {
  data: () => ({
    isLoading: false,
    selectedSource: null,
    deviceId: null,
    deploymentId: null
  }),
  components: { SourceList, HeaderView },
  methods: {
    onSourceSelected (newSource) {
      this.selectedSource = newSource
      this.deviceId = this.selectedSource.deviceId
      this.deploymentId = this.selectedSource.deploymentId
    },
    async importFiles () {
      if (this.deviceId) {
        const existingSiteWithDeviceId = Stream.query().where('deviceId', this.deviceId).get()
        if (existingSiteWithDeviceId && existingSiteWithDeviceId.length > 0) {
          const streamId = existingSiteWithDeviceId[0].id
          console.log('existingSiteWithDeviceId', existingSiteWithDeviceId, streamId)
          this.$router.push({path: '/import-to-existing-site', query: { folderPath: this.selectedSource.path, deviceId: this.deviceId, streamId: streamId, deploymentId: this.deploymentId }})
          return
        }
      }
      this.$router.push({path: '/add', query: { folderPath: this.selectedSource.path, deviceId: this.deviceId, deploymentId: this.deploymentId }})
    }
  }
}
</script>

<style lang="scss" scoped>
.import-stream {
  &__wrapper {
    margin: 32px auto;
    padding: $default-padding-margin;
    max-width: 500px;
  }
}
</style>
