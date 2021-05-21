<template>
  <div class="wrapper">
    <header-view title="Select Site" :shouldShowBackButton="props.selectedFolderPath != null"/>
    <fieldset>
      <div class="notification default-notice" v-if="errorMessage">
        <button class="delete" @click="onCloseAlert()"></button>
        {{ errorMessage }}
      </div>
      <div class="field field-dropdown">
        <label for="project" class="label">
          Project name
        </label>
        <SelectProjectDropDownInput
        @onSelectedProjectChanged="onSelectedProject"/>
      </div>
      <div class="field field-dropdown" :class="{'field-dropdown-with-help': siteDropdownHelpText !== null}">
        <label for="name" class="label">
          Site name
          <span class="help is-warning" v-if="shouldShowNameHelperMessage">You must enter a site name</span>
        </label>
        <SelectSiteDropdownInput
        :updateIsCreatingNewSite.sync="isCreatingNewSite"
        :isWarning="shouldShowNameHelperMessage"
        :initialSite="detectedSiteFromDeployment"
        :helpText="siteDropdownHelpText"
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
import SelectProjectDropDownInput from './SelectProjectDropDownInput'
import SelectSiteDropdownInput from './SelectSiteDropDownInput'
import api from '../../../../utils/api'
import ipcRendererSend from '../../services/ipc'
import FileFormat from '../../../../utils/FileFormat'
import dateHelper from '../../../../utils/dateHelper'
import settings from 'electron-settings'
import streamHelper from '../../../../utils/streamHelper'
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
      isCreatingNewSite: true,
      errorMessage: ''
    }
  },
  components: { Map, HeaderView, SelectSiteDropdownInput, SelectProjectDropDownInput },
  async created () {
    if (!this.$route.query) return
    // TODO: add logic & UI to go back to import step
    if (this.$route.query.folderPath) {
      this.props.selectedFolderPath = this.$route.query.folderPath
    }
    if (this.$route.query.deploymentInfo) {
      this.props.deploymentInfo = JSON.parse(this.$route.query.deploymentInfo)
      // TODO: check if there is any site detected
      // if any site detected, then check if that site is already in db
      // if not, then create one
      if (this.detectedSiteFromDeployment.id) { // has stream infomation attached to deployment info
        console.log('detected site from deployment')
        var existStreamInDB = await ipcRendererSend('db.streams.get', `db.streams.get.${Date.now()}`, this.detectedSiteFromDeployment.id)
        if (!existStreamInDB) { // no stream in local db, then auto create one
          existStreamInDB = await this.saveSiteInLocalDB(this.detectedSiteFromDeployment, settings.get('settings.production_env'))
        }
        // and set the selected site to be the detected site from deployment
        this.updateSelectedExistingSite(existStreamInDB)
      }
    }
    if (this.$route.query.selectedFiles) {
      this.props.selectedFiles = JSON.parse(this.$route.query.selectedFiles)
    }
  },
  computed: {
    detectedSiteFromDeployment () {
      return this.props.deploymentInfo ? this.props.deploymentInfo.stream : null
    },
    siteDropdownHelpText () {
      return this.detectedSiteFromDeployment ? 'Detected deployment from RFCx Companion' : null
    },
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
    async importFiles () {
      if (this.isCreatingNewSite) {
        await this.createSite()
      }
      // if site created successfully, it will be assigned to the selected existing site
      // then add file to site
      if (!this.selectedExistingSite) return
      if (this.props.selectedFolderPath) {
        this.$file.handleDroppedFolder(this.props.selectedFolderPath, this.selectedExistingSite, {
          deploymentId: this.props.deploymentInfo ? this.props.deploymentInfo.id : ''
        })
      }
      await this.$store.dispatch('setSelectedStreamId', this.selectedExistingSite.id)
      this.$router.push('/')
    },
    async createSite () {
      if (this.isCreatingNewSite && !streamHelper.isValidName(this.form.selectedSiteName)) {
        this.errorMessage = streamHelper.getNameError(this.form.selectedSiteName)
        return
      }
      const idToken = await ipcRendererSend('getIdToken', `sendIdToken`)
      const name = this.form.selectedSiteName
      const latitude = this.form.selectedLatitude
      const longitude = this.form.selectedLongitude
      const isPublic = false
      const fileFormat = FileFormat.fileFormat.AUTO_DETECT
      const env = settings.get('settings.production_env')
      try {
        this.isLoading = true
        const id = await api.createStream(env, name, latitude, longitude, isPublic, null, idToken)
        this.selectedExistingSite = await this.saveSiteInLocalDB({
          id,
          name,
          latitude,
          longitude,
          timestampFormat: fileFormat,
          isPublic: isPublic
        }, env)
      } catch (error) {
        this.isLoading = false
        this.errorMessage = error === 'Unauthorized' ? 'You are not authorized.' : error
      }
    },
    async saveSiteInLocalDB (site, env) {
      const now = new Date()
      const obj = {
        ...site,
        timezone: dateHelper.getDefaultTimezone(site.latitude, site.longitude),
        env: env ? 'production' : 'staging',
        serverCreatedAt: site.createdAt !== undefined ? new Date(site.createdAt) : now,
        serverUpdatedAt: site.updatedAt !== undefined ? new Date(site.updatedAt) : now,
        lastModifiedAt: now
      }
      console.log('obj', obj, obj.createdAt !== undefined)
      return ipcRendererSend('db.streams.create', `db.streams.create.${now}`, obj)
    },
    updateSelectedExistingSite (site) {
      this.selectedExistingSite = site
      if (site) {
        this.isCreatingNewSite = false
        this.form.selectedProjectName = this.selectedExistingSite.project
        this.form.selectedSiteName = this.selectedExistingSite.name
        this.form.selectedLatitude = this.selectedExistingSite.latitude
        this.form.selectedLongitude = this.selectedExistingSite.longitude
      }
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
    },
    onSelectedProject (project) {
      console.log('on select project', project)
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
  .field-dropdown-with-help {
    margin-bottom: 2rem !important;
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
