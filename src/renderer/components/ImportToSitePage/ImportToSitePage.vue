<template>
  <div class="wrapper">
    <header-view title="Select Site" :shouldShowBackButton="props.selectedFolderPath != null"/>
    <fieldset>
      <div class="notification default-notice" v-show="errorMessage">
        <button class="delete" @click="onCloseAlert()"></button>
        {{ errorMessage }}
      </div>
      <div class="field field-stream-name">
        <label for="name" class="label">
          Site name
          <span class="help is-warning" v-if="shouldShowNameHelperMessage">You must enter a site name</span>
        </label>
        <DropDownWithSearchInput 
          placeholder="Search..."
          @onClearSearchInput="onClearSiteNameSearchInput"
          @onOptionSelected="onSelectSiteName"
          specialOption="Create New Site"
          @onSpecialOptionSelected="onSelectToCreateSite"
        />
        <!-- <div class="control">
          <input v-model="form.name" class="input" :class="{'is-warning': shouldShowNameHelperMessage}" type="text" placeholder="Jaguar 1" />
        </div> -->
      </div>
      <div class="field">
        <label for="location" class="label">Location</label>
        <Map class="map-wrapper" @locationSelected="onSelectLocation" :lngLat="selectedCoordinates" ref="map"></Map>
      </div>
      <div class="folder-path-input__wrapper" v-if="props.selectedFolderPath != null">
        <label for="path" class="label">Folder path</label>
        <div class="field has-addons" >
          <div class="control is-expanded">
            <input class="input" type="path" :value="props.selectedFolderPath" readonly>
          </div>
          <div class="control">
            <a class="button" @click="$router.push('/import')">Change</a>
          </div>
        </div>
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
          >Import</button>
        </p>
      </div>
    </fieldset>
  </div>
</template>

<script>
import Map from '../Common/Map/Map'
import HeaderView from '../Common/HeaderWithBackButton'
import DropDownWithSearchInput from '../Common/Dropdown/DropdownWithSearchInput'

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
      isLoading: false,
      errorMessage: ''
    }
  },
  components: { Map, HeaderView, DropDownWithSearchInput },
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
      return this.form.selectedCoordinates && this.form.selectedCoordinates.length > 0 && (!this.form.selectedSiteName || this.form.selectedSiteName === '')
    },
    hasPassedValidation () {
      return this.form.name && this.form.selectedLatitude && this.form.selectedLongitude
    },
    selectedCoordinates () {
      return this.form.selectedLatitude ? [this.form.selectedLongitude, this.form.selectedLatitude] : null
    }
  },
  methods: {
    importFiles () {
      console.log('import files')
    },
    onSelectLocation (coordinates) {
      this.form.selectedLongitude = coordinates[0]
      this.form.selectedLatitude = coordinates[1]
    },
    onSelectSiteName (site) {
      console.log('onSelectSiteName:', site.name)
      this.form.selectedSiteName = site.name
    },
    onSelectToCreateSite () {
      console.log('onSelectToCreateSite')
    },
    onClearSiteNameSearchInput () {
      console.log('onClearSiteNameSearchInput')
      this.form.selectedSiteName = ''
      // TODO: show dropdown again
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
