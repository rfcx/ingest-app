<template>
  <div class="wrapper">
    <div class="header">
      <header-view title="Select Site" :shouldShowBackButton="props.selectedFolderPath !== null"/>
      <div class="tag__wrapper">
        <AudioMothTag :show="props.deviceId" :isSelected="true"/>
        <deployment-tag 
          v-if="isFetchingDeploymentInfo || props.deploymentId"
          :isChecking="isFetchingDeploymentInfo"
          :isDetected="props.deploymentId !== null && deploymentInfo !== null"
          :isNotMatched="!isSelectedSiteMatchWithDetectedDeployment"
        />
      </div>
    </div>
    <fieldset>
      <div class="notification default-notice" v-if="errorMessage">
        <button class="delete" @click="errorMessage = ''"></button>
        {{ errorMessage }}
      </div>
      <div class="field field-dropdown" v-if="shouldShowProjectSelector">
        <label for="project" class="label">
          Project name
        </label>
        <SelectProjectDropDownInput
        :helpText="siteDropdownHelpText"
        :initialProject="detectedProjectFromDeployment"
        :disabled="isFetchingDeploymentInfo"
        @onSelectedProjectNameChanged="onSelectedProject"/>
      </div>
      <div class="field field-dropdown" :class="{'field-dropdown-with-help': siteDropdownHelpText !== null}">
        <label for="name" class="label">
          Site name
          <span class="help is-warning" v-if="shouldShowNameHelperMessage">You must enter a site name</span>
        </label>
        <SelectSiteDropdownInput
        ref="siteSelector"
        :project="selectedProject"
        :updateIsCreatingNewSite.sync="isCreatingNewSite"
        :isWarning="shouldShowNameHelperMessage === true || shouldShowDetectedSiteWarning === true"
        :initialSite="detectedSiteFromDeployment"
        :helpText="siteDropdownHelpText"
        :disabled="isFetchingDeploymentInfo"
        @onSelectedSiteNameChanged="onSelectedSite"/>
      </div>
      <div class="field">
        <label for="location" class="label">Location</label>
        <Map class="map-wrapper" @locationSelected="onUpdateLocation" :initialCoordinates="selectedCoordinates" :isReadOnly="!isCreatingNewSite" ref="map"></Map>
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
import AudioMothTag from '../Common/Tag/AudioMothTag'
import DeploymentTag from '../Common/Tag/DeploymentTag'
import HeaderView from '../Common/HeaderWithBackButton'
import SelectProjectDropDownInput from './SelectProjectDropDownInput'
import SelectSiteDropdownInput from './SelectSiteDropDownInput'
import api from '../../../../utils/api'
import fileHelper from '../../../../utils/fileHelper'
import ipcRendererSend from '../../services/ipc'
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
        deploymentId: null,
        deviceId: null,
        selectedFolderPath: null,
        selectedFiles: null
      },
      selectedProject: null,
      selectedExistingSite: null,
      deploymentInfo: null,
      isLoading: false,
      isFetchingDeploymentInfo: false,
      isCreatingNewSite: true,
      errorMessage: ''
    }
  },
  components: { Map, AudioMothTag, DeploymentTag, HeaderView, SelectSiteDropdownInput, SelectProjectDropDownInput },
  async created () {
    if (!this.$route.query) return
    // TODO: add logic & UI to go back to import step

    // handle selected folder / files
    if (this.$route.query.folderPath) {
      this.props.selectedFolderPath = this.$route.query.folderPath
    } else if (this.$route.query.selectedFiles) {
      this.props.selectedFiles = JSON.parse(this.$route.query.selectedFiles)
    }

    this.props.deploymentId = this.$route.query.deploymentId
    this.props.deviceId = this.$route.query.deviceId

    // TODO: refactor this condition
    if (this.props.selectedFiles && this.props.selectedFiles.length > 0) {
      let deviceInfo

      // try to get device info from the first wav file
      const firstWavFile = this.props.selectedFiles.find(file => {
        return fileHelper.getExtension(file.path) === 'wav' // read only wav file header info
      })
      deviceInfo = await this.$file.getDeviceInfo(firstWavFile)

      // try to get device info from the first directory
      if (!deviceInfo) {
        const firstFolder = this.props.selectedFiles.find(file => {
          return fileHelper.isFolder(file.path)
        })
        deviceInfo = await this.$file.getDeviceInfoFromFolder(firstFolder.path)
      }

      // set device id & deployment id if any
      if (deviceInfo) {
        this.props.deviceId = deviceInfo.deviceId
        this.props.deploymentId = deviceInfo.deploymentId
      }
    }

    if (this.props.deviceId && !this.props.deploymentId) { // show protip
      this.errorMessage = `Suggestion: use the RFCx companion to deploy your AudioMoth device in the future to pre-populate the site name below.`
    }

    if (this.props.deploymentId) {
    // get deployment info
      try {
        this.isFetchingDeploymentInfo = true
        this.deploymentInfo = await this.getDeploymentInfo(this.props.deploymentId)
        this.isFetchingDeploymentInfo = false
      } catch (error) {
        this.isFetchingDeploymentInfo = false
        switch (error.name) {
          case 'EmptyResultError':
            this.errorMessage = 'Site with attached deployment could not be found. Please manually select a site.'
            return
          case 'ForbiddenError':
            this.errorMessage = `You don't have permission to the site with attached deployment. Please manually select a site.`
            return
          default:
            this.errorMessage = error.message
        }
      }
    }
    // check if site detected
    if (this.detectedSiteFromDeployment && this.detectedSiteFromDeployment.id) { // has stream infomation attached to deployment info
      // and set the selected site to be the detected site from deployment
      this.updateSelectedExistingSite(this.detectedSiteFromDeployment)
    }
    if (this.detectedProjectFromDeployment) {
      this.selectedProject = this.detectedProjectFromDeployment
    }
  },
  computed: {
    detectedSiteFromDeployment () {
      if (this.deploymentInfo && this.deploymentInfo.stream) {
        return streamHelper.parseSite(this.deploymentInfo.stream)
      } else {
        return null
      }
    },
    detectedProjectFromDeployment () {
      if (this.detectedSiteFromDeployment && this.detectedSiteFromDeployment.projectName && this.detectedSiteFromDeployment.projectId) {
        return { id: this.detectedSiteFromDeployment.projectId, name: this.detectedSiteFromDeployment.projectName }
      }
      return null
    },
    isSelectedSiteMatchWithDetectedDeployment () {
      const getSiteId = site => site ? site.id : null
      const bothValuesExist = this.detectedSiteFromDeployment && this.selectedExistingSite
      const bothValuesHaveSameId = getSiteId(this.detectedSiteFromDeployment) === getSiteId(this.selectedExistingSite)
      return bothValuesExist && bothValuesHaveSameId
    },
    siteDropdownHelpText () {
      if (this.detectedSiteFromDeployment && this.selectedExistingSite) {
        if (this.isSelectedSiteMatchWithDetectedDeployment) {
          return 'Detected deployment from RFCx Companion'
        }
        return `Site doesn't match with detectetd deployment from RFCx Companion`
      }
      return null
    },
    shouldShowProjectSelector () {
      return !this.detectedSiteFromDeployment || (this.detectedSiteFromDeployment !== null && this.detectedProjectFromDeployment !== null)
    },
    shouldShowNameHelperMessage () {
      return this.selectedCoordinates && this.selectedCoordinates.length > 0 && (!this.form.selectedSiteName || this.form.selectedSiteName === '') && this.hasPassProjectValidation
    },
    shouldShowDetectedSiteWarning () {
      return this.detectedSiteFromDeployment && this.selectedExistingSite && !this.isSelectedSiteMatchWithDetectedDeployment
    },
    hasPassProjectValidation () {
      return !this.shouldShowProjectSelector || (this.shouldShowProjectSelector && this.selectedProject !== null)
    },
    hasPassedValidation () {
      return this.form.selectedSiteName && this.selectedCoordinates && this.selectedCoordinates.length > 1 && this.hasPassProjectValidation
    },
    selectedCoordinates () {
      if (typeof this.form.selectedLatitude !== 'number' || typeof this.form.selectedLongitude !== 'number') {
        return null
      }
      return [this.form.selectedLongitude, this.form.selectedLatitude]
    },
    actionButtonTitle () {
      return this.isCreatingNewSite ? 'Create' : 'Import'
    }
  },
  methods: {
    async getDeploymentInfo (deploymentId) {
      if (!deploymentId) return Promise.resolve(null)
      return new Promise(async (resolve, reject) => {
        const idToken = await ipcRendererSend('getIdToken', `sendIdToken`)
        api.getDeploymentInfo(deploymentId, idToken).then(response => {
          const stream = response.stream
          const id = response.id
          const deploymentType = response.deploymentType
          const deployedAt = response.deployedAt
          if (!(stream && id)) resolve(null) // response doesn't have all required field
          else resolve({stream, id, deploymentType, deployedAt})
        }).catch(error => {
          console.log('getDeploymentInfo error', error.name)
          // TODO: handle error
          reject(error)
        })
      })
    },
    async importFiles () {
      if (this.isCreatingNewSite) {
        await this.createSite()
      }
      // if site created successfully, it will be assigned to the selected existing site
      // then add file to site
      if (!this.selectedExistingSite) return
      let localSite = await ipcRendererSend('db.streams.get', `db.streams.get.${Date.now()}`, this.selectedExistingSite.id)
      if (!localSite) { // double check if the selected site already saved to local db
        localSite = await this.saveSiteInLocalDB(this.selectedExistingSite)
      }
      this.selectedExistingSite = localSite
      if (this.props.selectedFolderPath) {
        this.$file.handleDroppedFolder(this.props.selectedFolderPath, this.selectedExistingSite, {
          deploymentId: this.deploymentInfo ? this.deploymentInfo.id : ''
        })
      }
      if (this.props.selectedFiles && this.props.selectedFiles.length > 0) {
        this.$file.handleDroppedFiles(this.props.selectedFiles, this.selectedExistingSite)
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
      const projectId = this.selectedProject.id
      const isPublic = false
      const env = settings.get('settings.production_env')
      try {
        this.isLoading = true
        const id = await api.createStream(env, name, latitude, longitude, isPublic, projectId, idToken)
        this.selectedExistingSite = await this.saveSiteInLocalDB({
          id,
          name,
          latitude,
          longitude,
          isPublic: isPublic,
          project: this.selectedProject
        })
      } catch (error) {
        this.isLoading = false
        this.errorMessage = error === 'Unauthorized' ? 'You are not authorized.' : error
      }
    },
    async saveSiteInLocalDB (site) {
      const obj = streamHelper.parseSite(site)
      return ipcRendererSend('db.streams.create', `db.streams.create.${Date.now()}`, obj)
    },
    updateSelectedExistingSite (site) {
      this.selectedExistingSite = site
      if (site) {
        this.isCreatingNewSite = false
        this.form.selectedProjectName = this.selectedExistingSite.project
        this.form.selectedSiteName = this.selectedExistingSite.name
        this.form.selectedLatitude = this.selectedExistingSite.latitude
        this.form.selectedLongitude = this.selectedExistingSite.longitude
      } else {
        this.isCreatingNewSite = true
        this.form.selectedProjectName = ''
        this.form.selectedSiteName = ''
        this.form.selectedLatitude = null
        this.form.selectedLongitude = null
        this.$refs.siteSelector.resetSelectedSite()
      }
    },
    onUpdateLocation (coordinates) {
      console.log('onUpdateLocation', coordinates)
      this.form.selectedLongitude = coordinates[0]
      this.form.selectedLatitude = coordinates[1]
    },
    onSelectedSite (site) {
      // update site name in the form
      this.form.selectedSiteName = site.name

      // update location in the form, if needed (select existing site or on the first attempt to create new)
      const hasBeenChoosingExistingSiteBefore = this.isCreatingNewSite && this.selectedExistingSite !== null // create new site, after been choosing existing one
      if (!this.isCreatingNewSite || hasBeenChoosingExistingSiteBefore) {
        this.onUpdateLocation([site.longitude, site.latitude])
      }

      // update selecting existing site, if any
      this.selectedExistingSite = !this.isCreatingNewSite ? site : null
    },
    onSelectedProject (project) {
      this.selectedProject = project
      this.form.selectedProjectName = project && project.name ? project.name : ''
    }
  },
  watch: {
    selectedProject: {
      handler (val, previousVal) {
        if (val === previousVal) return
        const getProjectName = project => project ? project.name : null
        if (val === null || val === undefined) { // has reset project data
          this.updateSelectedExistingSite(null)
        } else if (!this.isCreatingNewSite && getProjectName(this.selectedExistingSite) !== val.name) { // existing site that been selected is in different project
          this.updateSelectedExistingSite(null)
        }
      }
    }
  }
}
</script>

<style src="./ImportToSitePage.scss" scoped></style>
