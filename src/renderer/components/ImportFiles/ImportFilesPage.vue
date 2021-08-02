<template>
  <div class="import-stream__wrapper">
    <header-view title="Import audio files" />
    <p class="subtitle">Insert AudioMoth SD Card or choose the folder/files to import.</p>
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
          :disabled="!selectedSource"
          @click.prevent="importFiles"
        >Import</button>
      </p>
    </div>
  </div>
</template>

<script>
import SourceList from './SourceList'
import FileSource from './FileSorce'
import HeaderView from '../Common/HeaderWithBackButton'

export default {
  data: () => ({
    selectedSource: null,
    deviceId: null,
    deploymentId: null
  }),
  components: { SourceList, HeaderView },
  methods: {
    onSourceSelected (newSource) {
      this.selectedSource = newSource
      console.log('onSourceSelected', this.selectedSource)
      this.deviceId = this.selectedSource.deviceId
      this.deploymentId = this.selectedSource.deploymentId
    },
    async importFiles () {
      this.redirectUserToSelectSiteScreen()
    },
    redirectUserToSelectSiteScreen () {
      const selectSitePath = '/select-site'
      if (this.selectedSource instanceof FileSource.FileSourceFromFiles) {
        this.$router.push({path: selectSitePath, query: { selectedFiles: JSON.stringify(this.selectedSource.selectedFiles), deviceId: this.deviceId, deploymentId: this.deploymentId }})
      } else {
        this.$router.push({path: selectSitePath, query: { folderPath: this.selectedSource.path, deviceId: this.deviceId, deploymentId: this.deploymentId }})
      }
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
