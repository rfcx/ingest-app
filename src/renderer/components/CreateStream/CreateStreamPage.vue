<template>
  <div class="wrapper">
    <header-view title="Create Site" :shouldShowBackButton="selectedFolderPath != null"/>
    <fieldset>
      <div class="notification default-notice" v-show="error">
        <button class="delete" @click="onCloseAlert()"></button>
        {{ error }}
      </div>
      <div class="field field-stream-name">
        <label for="name" class="label">
          Site name
          <span class="help is-warning" v-if="shouldShowNameHelperMessage">You must enter a site name</span>
        </label>
        <div class="control">
          <input v-model="name" class="input" :class="{'is-warning': shouldShowNameHelperMessage}" type="text" placeholder="Jaguar 1" />
        </div>
      </div>
      <div class="field">
        <label for="location" class="label">Location</label>
        <Map class="map-wrapper" @locationSelected="onSelectLocation"></Map>
      </div>
      <div class="folder-path-input__wrapper" v-if="selectedFolderPath != null">
        <label for="path" class="label">Folder path</label>
        <div class="field has-addons" >
          <div class="control is-expanded">
            <input class="input" type="path" :value="selectedFolderPath" readonly>
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
            @click.prevent="createStream"
          >Create</button>
        </p>
      </div>
    </fieldset>
  </div>
</template>

<script>
import Stream from '../../store/models/Stream'
import api from '../../../../utils/api'
import streamHelper from '../../../../utils/streamHelper'
import dateHelper from '../../../../utils/dateHelper'
import settings from 'electron-settings'
import Map from './Map'
import HeaderView from '../Common/HeaderWithBackButton'

export default {
  data () {
    return {
      name: '',
      selectedLatitude: null,
      selectedLongitude: null,
      selectedFolderPath: null, // prop from import page
      deviceId: null, // prop from import page
      isLoading: false,
      hasPassValidation: false,
      error: '',
      shouldShowNameHelperMessage: false
    }
  },
  components: { Map, HeaderView },
  computed: {
    hasPassedValidation () {
      return this.name && this.selectedLatitude && this.selectedLongitude
    }
  },
  created () {
    if (!this.$route.query) return
    // TODO: add logic & UI to go back to import step
    if (this.$route.query.folderPath) {
      this.selectedFolderPath = this.$route.query.folderPath
      console.log('create with +', this.selectedFolderPath)
    }
    if (this.$route.query.deviceId) {
      this.deviceId = this.$route.query.deviceId
      console.log('+', this.deviceId)
    }
  },
  methods: {
    onSelectLocation (coordinates) {
      console.log('on selected location: ', coordinates)
      this.selectedLongitude = coordinates[0]
      this.selectedLatitude = coordinates[1]
      if (!this.name || this.name === '') {
        this.shouldShowNameHelperMessage = true
      }
    },
    createStream () {
      if (!streamHelper.isValidName(this.name)) {
        this.error = streamHelper.getNameError(this.name)
        return
      }
      const visibility = false
      const latitude = this.selectedLatitude
      const longitude = this.selectedLongitude
      let listener = (event, arg) => {
        this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
        let idToken = arg
        api
          .createStream(
            this.isProductionEnv(),
            this.name,
            latitude,
            longitude,
            visibility,
            this.deviceId,
            idToken
          )
          .then(async streamId => {
            const stream = {
              id: streamId,
              name: this.name,
              latitude: latitude,
              longitude: longitude,
              timestampFormat: 'Auto-detect',
              env: this.isProductionEnv() ? 'production' : 'staging',
              visibility: visibility,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              deviceId: this.deviceId || ''
            }
            console.log('creating stream', JSON.stringify(stream))
            await Stream.insert({ data: stream })
            // add files to site/stream
            if (this.selectedFolderPath) {
              stream.defaultTimezone = dateHelper.getDefaultTimezone(stream.latitude, stream.longitude)
              this.$file.handleDroppedFolder(this.selectedFolderPath, stream) // TODO: fix to pass the stream model object in
            }
            this.$store.dispatch('setSelectedStreamId', stream.id)
            this.$router.push('/')
          })
          .catch(error => {
            console.log('error while creating stream', error)
            this.isLoading = false
            if (error.status === 401 || error.data === 'UNAUTHORIZED') {
              this.error = 'You are not authorized.'
            } else {
              this.error = error.message || error.data
            }
          })
      }
      this.isLoading = true
      this.$electron.ipcRenderer.send('getIdToken')
      this.$electron.ipcRenderer.on('sendIdToken', listener)
    },
    isProductionEnv () {
      return settings.get('settings.production_env')
    },
    onCloseAlert () {
      this.error = null
    }
  },
  watch: {
    name (val, oldVal) {
      if (val === oldVal) return
      this.error = null
      this.shouldShowNameHelperMessage = !val || val === ''
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
