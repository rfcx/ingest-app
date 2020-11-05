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
import api from '../../../../utils/api'

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
    async getDeploymentInfo (deploymentId) {
      if (!deploymentId) return Promise.resolve(null)
      return new Promise((resolve, reject) => {
        let listener = (event, idToken) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          api.getDeploymentInfo(deploymentId, idToken)
            .then(response => {
              this.isLoading = false
              console.log(response)
              const locationName = response.locationName
              const latitude = response.latitude
              const longitude = response.longitude
              resolve({locationName, coordinates: [longitude, latitude]})
            }).catch(_ => {
              this.isLoading = false
              resolve(null)
            })
        }
        this.isLoading = true
        this.$electron.ipcRenderer.send('getIdToken')
        this.$electron.ipcRenderer.on('sendIdToken', listener)
      })
    },
    async importFiles () {
      const deploymentInfo = await this.getDeploymentInfo(this.deploymentId)
      if (this.deviceId) {
        const existingSiteWithDeviceId = Stream.query().where('deviceId', this.deviceId).get()
        if (existingSiteWithDeviceId && existingSiteWithDeviceId.length > 0) {
          const streamId = existingSiteWithDeviceId[0].id
          console.log('existingSiteWithDeviceId', existingSiteWithDeviceId, streamId)
          this.$router.push({path: '/import-to-existing-site', query: { folderPath: this.selectedSource.path, deviceId: this.deviceId, streamId: streamId, deploymentInfo: JSON.stringify(deploymentInfo) }})
          return
        }
      }
      this.$router.push({path: '/add', query: { folderPath: this.selectedSource.path, deviceId: this.deviceId, deploymentInfo: JSON.stringify(deploymentInfo) }})
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
