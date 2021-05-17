<template>
  <div class="wrapper">
    <header-view title="Select Site" :shouldShowBackButton="props.selectedFolderPath != null"/>
    <fieldset>
      <div class="notification default-notice" v-if="errorMessage">
        <button class="delete" @click="onCloseAlert()"></button>
        {{ errorMessage }}
      </div>
      <div class="field field-stream-name">
        <label for="name" class="label">
          Site name
          <span class="help is-warning" v-if="shouldShowNameHelperMessage">You must enter a site name</span>
        </label>
        <SelectSiteDropdownInput
        :updateIsCreatingNewSite.sync="isCreatingNewSite"
        :isWarning="shouldShowNameHelperMessage"
        @onSelectedSiteNameChanged="onSelectedSite"/>
      </div>
      <div class="field">
        <label for="location" class="label">Location</label>
        <Map class="map-wrapper" @locationSelected="onUpdateLocation" :lngLat="selectedCoordinates" :isReadOnly="!isCreatingNewSite" ref="map"></Map>
      </div>
      <div class="field is-grouped controls-group">
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
            :disabled="!hasPassedValidation"
            @click.prevent="importFiles"
          >{{ actionButtonTitle }}</button>
        </p>
      </div>
    </fieldset>
  </div>
</template>

<script>
import Map from '../Common/Map/Map'
import HeaderView from '../Common/HeaderWithBackButton'
import SelectSiteDropdownInput from './SelectSiteDropDownInput'
export default {
  data () {
    return {
      form: {
        selectedProjectName: '',
        selectedSiteName: '',
        selectedLatitude: null,
        selectedLongitude: null
      },
      props: {
        deploymentInfo: null,
        selectedFolderPath: null,
        selectedFiles: null
      },
      selectedExistingSite: null,
      isLoading: false,
      isCreatingNewSite: false,
      errorMessage: ''
    }
  },
  components: { Map, HeaderView, SelectSiteDropdownInput },
  created () {
    if (!this.$route.query) return
    // TODO: add logic & UI to go back to import step
    if (this.$route.query.folderPath) {
      this.props.selectedFolderPath = this.$route.query.folderPath
    }
    if (this.$route.query.deploymentInfo) {
      this.props.deploymentInfo = JSON.parse(this.$route.query.deploymentInfo)
    }
    if (this.$route.query.selectedFiles) {
      this.props.selectedFiles = JSON.parse(this.$route.query.selectedFiles)
    }
  },
  computed: {
    shouldShowNameHelperMessage () {
      return this.selectedCoordinates && this.selectedCoordinates.length > 0 && (!this.form.selectedSiteName || this.form.selectedSiteName === '')
    },
    hasPassedValidation () {
      return this.form.selectedSiteName && this.form.selectedLatitude && this.form.selectedLongitude
    },
    selectedCoordinates () {
      return this.form.selectedLatitude ? [this.form.selectedLongitude, this.form.selectedLatitude] : []
    },
    actionButtonTitle () {
      return this.isCreatingNewSite ? 'Create' : 'Import'
    }
  },
  methods: {
    importFiles () {
      console.log('import files')
    },
    onUpdateLocation (coordinates) {
      console.log('onUpdateLocation')
      this.form.selectedLongitude = coordinates[0]
      this.form.selectedLatitude = coordinates[1]
    },
    onSelectedSite (site) {
      // update site name in the form
      this.form.selectedSiteName = site.name

      // update location in the form, if needed (select existing site or on the first attempt to create new)
      const hasBeenChoosingExistingSiteBefore = this.isCreatingNewSite && this.selectedExistingSite // create new site, after been choosing existing one
      if (!this.isCreatingNewSite || hasBeenChoosingExistingSiteBefore) {
        this.onUpdateLocation([site.longitude, site.latitude])
      }

      // update selecting existing site, if any
      this.selectedExistingSite = !this.isCreatingNewSite ? site : null
      console.log('form after selected site', JSON.stringify(this.form))
    }
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    margin: $wrapper-margin;
    padding: $default-padding-margin;
    max-width: $wrapper-width;
  }
  span.help {
    display: inline;
  }
  .controls-group {
    margin-top: $default-padding-margin;
  }
  .is-link {
    cursor: pointer;
    color: $body-text-color !important;
  }
</style>

<style lang="scss">
  .map-wrapper {
    height: 300px;
    width: $wrapper-width;
    margin-bottom: $default-padding-margin;
    .mapboxgl-canvas {
      height: 300px !important;
    }
  }
</style>
