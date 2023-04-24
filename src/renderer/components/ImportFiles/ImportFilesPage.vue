<template>
  <div class="import-stream__wrapper">
    <header-view title="Import audio files" :shouldShowBackButton="true" />
    <p class="subtitle">Insert RFCx Companion SD Card or choose the folder/files to import.</p>
    <source-list @sourceSelected="onSourceSelected"></source-list>
    <p class="control control-btn">
        <button
          type="button"
          class="button is-rounded is-primary"
          :disabled="!selectedSource"
          @click.prevent="redirectUserToSelectSiteScreen"
        >Next</button>
      </p>
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
    deploymentId: null,
    recorderType: null
  }),
  components: { SourceList, HeaderView },
  methods: {
    onSourceSelected (newSource) {
      this.selectedSource = newSource
      console.info('[ImportFilePage] onSourceSelected', this.selectedSource)
      this.deviceId = this.selectedSource.deviceId
      this.deploymentId = this.selectedSource.deploymentId
      this.recorderType = this.selectedSource.recorderType
      // this.redirectUserToSelectSiteScreen()
    },
    redirectUserToSelectSiteScreen () {
      const selectSitePath = '/select-site'
      const query = {
        deviceId: this.deviceId,
        deploymentId: this.deploymentId,
        recorderType: this.recorderType
      }
      if (this.selectedSource instanceof FileSource.FileSourceFromFiles) {
        this.$router.push({path: selectSitePath, query: { ...query, selectedFiles: JSON.stringify(this.selectedSource.selectedFiles) }})
      } else {
        this.$router.push({path: selectSitePath, query: { ...query, folderPath: this.selectedSource.path }})
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
