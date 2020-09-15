<template>
  <div class="import-stream__wrapper">
    <h1>Import audio files from AudioMoth</h1>
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
import FileHelper from '../../../../utils/fileHelper'
import FileInfo from '../../services/FileInfo'
import Stream from '../../store/models/Stream'

export default {
  data: () => ({
    isLoading: false,
    selectedSource: null,
    deviceId: null
  }),
  components: { SourceList },
  methods: {
    onSourceSelected (newSource) {
      this.selectedSource = newSource
    },
    readFilesForDeviceId () {
      this.isLoading = true
      // see all files in the folder
      const path = this.selectedSource.path
      const stuffInDirectory = FileHelper
        .getFilesFromDirectoryPath(path)
        .map((name) => {
          return { name: name, path: path + '/' + name }
        })
      // read file header info
      const deviceIds = stuffInDirectory.filter(file => {
        return FileHelper.getExtension(file.path) === 'wav' // read only wav file header info
      }).map(file => {
        const info = new FileInfo(file.path)
        return info.deviceId
      })/* .filter(id => id !== '').filter((v, i, a) => a.indexOf(v) === i)
      console.log('deviceIds', uniqueDeviceIds) */
      this.isLoading = false
      if (deviceIds.length > 0) {
        this.deviceId = deviceIds[0] // assign first device id as a stream device id
        return Promise.resolve()
      } else {
        return Promise.reject(new Error('Device ID not found'))
      }
    },
    async importFiles () {
      await this.readFilesForDeviceId()
      if (this.deviceId) {
        const existingSiteWithDeviceId = Stream.query().where('deviceId', this.deviceId).get()
        if (existingSiteWithDeviceId && existingSiteWithDeviceId.length > 0) {
          const streamId = existingSiteWithDeviceId[0].id
          console.log('existingSiteWithDeviceId', existingSiteWithDeviceId, streamId)
          this.$router.push({path: '/import-to-existing-site', query: { folderPath: this.selectedSource.path, deviceId: this.deviceId, streamId: streamId }})
          return
        }
      }
      this.$router.push({path: '/add', query: { folderPath: this.selectedSource.path, deviceId: this.deviceId }})
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
