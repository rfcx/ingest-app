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
          @click.prevent="importFiles"
        >Import</button>
      </p>
    </div>
  </div>
</template>

<script>
import SourceList from './SourceList'
import FileHelper from '../../../../utils/fileHelper'

export default {
  data: () => ({
    selectedSource: null,
    filesInSource: []
  }),
  components: { SourceList },
  methods: {
    onSourceSelected (newSource) {
      this.selectedSource = newSource

      // see all files in the folder
      const path = this.selectedSource.path
      const stuffInDirectory = FileHelper
        .getFilesFromDirectoryPath(path)
        .map((name) => {
          return { name: name, path: path + '/' + name }
        })
      this.filesInSource = stuffInDirectory
    },
    importFiles () {
      // TODO: pass device id to create stream
      this.$router.push({path: '/add', query: { folderPath: this.selectedSource.path }})
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
