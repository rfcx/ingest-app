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
import HeaderView from '../Common/HeaderWithBackButton'
import api from '../../../../utils/api'
import dateHelper from '../../../../utils/dateHelper'
import FileFormat from '../../../../utils/FileFormat'
import settings from 'electron-settings'
import ipcRendererSend from '../../services/ipc'

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
              console.log('getDeploymentInfo', response)
              const stream = response.stream
              const id = response.id
              const deploymentType = response.deploymentType
              const deployedAt = response.deployedAt
              resolve({stream, id, deploymentType, deployedAt})
            }).catch(error => {
              console.log('getDeploymentInfo error', error)
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
      if (!deploymentInfo) {
        this.redirectUserToCreateSiteScreen(deploymentInfo)
        return
      }
      const attachedStream = deploymentInfo.stream
      if (attachedStream.id) { // has stream infomation attached to deployment info
        var existStreamInDB = await ipcRendererSend('db.streams.get', `db.streams.get.${Date.now()}`, attachedStream.id)
        if (!existStreamInDB) { // no stream in local db
          existStreamInDB = await this.autoCreateSiteInformation(deploymentInfo.stream)
        }
        // then add files to that stream in local db
        await this.addFilesToExistingStream(existStreamInDB)
        await this.redirectUserToTheStreamInMainPage(existStreamInDB.id)
      } else { // no stream info in deployment
        this.redirectUserToCreateSiteScreen(deploymentInfo)
      }
    },
    async addFilesToExistingStream (stream) {
      this.$file.handleDroppedFolder(this.selectedSource.path, stream, { deviceId: this.deviceId, deploymentId: this.deploymentInfo ? this.deploymentInfo.id : '' }) // TODO: pass deployment id
    },
    async autoCreateSiteInformation (stream) {
      const streamObj = {
        id: stream.id,
        name: stream.name,
        latitude: stream.latitude,
        longitude: stream.longitude,
        timezone: dateHelper.getDefaultTimezone(stream.latitude, stream.longitude),
        timestampFormat: FileFormat.fileFormat.AUTO_DETECT,
        env: settings.get('settings.production_env') ? 'production' : 'staging',
        isPublic: stream.isPublic,
        serverCreatedAt: new Date(stream.createdAt),
        serverUpdatedAt: new Date(stream.updatedAt),
        lastModifiedAt: new Date()
      }
      return ipcRendererSend('db.streams.create', `db.streams.create.${Date.now()}`, streamObj)
    },
    redirectUserToCreateSiteScreen (deploymentInfo) {
      const deploymentInfoForCreateScreen = deploymentInfo && deploymentInfo.stream ? {locationName: deploymentInfo.stream.name, coordinates: [deploymentInfo.stream.longitude, deploymentInfo.stream.latitude]} : null
      this.$router.push({path: '/add', query: { folderPath: this.selectedSource.path, deviceId: this.deviceId, deploymentInfo: JSON.stringify(deploymentInfoForCreateScreen) }})
    },
    async redirectUserToTheStreamInMainPage (streamId) {
      await this.$store.dispatch('setSelectedStreamId', streamId)
      this.$router.push('/')
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
