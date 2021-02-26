<template>
  <div class="wrapper">
    <header-view title="Existing site detected"  :shouldShowBackButton="selectedFolderPath != null"/>
    <p class="subtitle">It seems you have created a site for this device before called "{{existingStream.name}}"</p>
    <button class="button is-rounded is-primary" @click.prevent="importFiles">Import files to "{{existingStream.name}}"</button>
    <button class="button is-rounded" @click.prevent="redirectToCreateStream">Create new a site</button>
  </div>
</template>

<script>
import Stream from '../../store/models/Stream'
import HeaderView from '../Common/HeaderWithBackButton'
export default {
  components: { HeaderView },
  data: () => ({
    selectedFolderPath: null,
    existingStreamId: null,
    deviceId: null,
    deploymentInfo: null

  }),
  computed: {
    existingStream () {
      return Stream.find(this.existingStreamId)
    }
  },
  created () {
    console.log(this.$route.query)
    if (!this.$route.query) return
    if (this.$route.query.streamId) this.existingStreamId = this.$route.query.streamId
    if (this.$route.query.folderPath) this.selectedFolderPath = this.$route.query.folderPath
    if (this.$route.query.deviceId) this.deviceId = this.$route.query.deviceId
    if (this.$route.query.deploymentInfo) this.deploymentInfo = this.$route.query.deploymentInfo
  },
  methods: {
    importFiles () {
      const streamId = this.existingStreamId
      this.$file.handleDroppedFolder(this.selectedFolderPath, this.existingStream, { deviceId: this.deviceId, deploymentId: this.deploymentInfo ? this.deploymentInfo.id : null })
      this.$store.dispatch('setSelectedStreamId', streamId)
      this.$router.push('/')
    },
    redirectToCreateStream () {
      this.$router.push({path: '/add', query: { folderPath: this.selectedFolderPath, deviceId: this.deviceId, deploymentInfo: this.deploymentInfo }})
    }
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  margin: 32px auto;
  padding: $default-padding-margin;
  max-width: 500px;
}
</style>
