<template>
  <div class="edit-stream__wrapper">
    <h1>Edit site</h1>
    <fieldset class="fieldset__wrapper">
      <div class="notification" v-show="error">
        <button class="delete" @click="onCloseAlert()"></button>
        {{ error }}
      </div>
      <div class="field field-stream-name">
        <label for="name" class="label">Site name</label>
        <div class="control">
          <input v-model="name" class="input" type="text" placeholder="Jaguar 1" />
        </div>
      </div>
      <div class="field field-stream-location">
        <label for="location" class="label">Location</label>
        <Map class="map-wrapper" @locationSelected="onSelectLocation" :lngLat="getStreamCoordinates()"></Map>
      </div>
      <div class="field is-grouped">
        <p class="control control-btn">
          <router-link class="control-btn" to="/">
            <button type="button" class="button is-rounded is-cancel">Cancel</button>
          </router-link>
        </p>
        <p class="control control-btn">
          <button type="button" class="button is-rounded is-primary" :class="{ 'is-loading': isLoading }" :disabled="!hasEditedData" @click.prevent="updateStream">Apply</button>
        </p>
      </div>
    </fieldset>
  </div>
</template>

<script>
import Stream from '../../store/models/Stream'
import api from '../../../../utils/api'
import settings from 'electron-settings'
import Map from '../CreateStream/Map'

export default {
  data () {
    return {
      name: '',
      selectedLatitude: null,
      selectedLongitude: null,
      isLoading: false,
      error: ''
    }
  },
  components: { Map },
  computed: {
    selectedStreamId () {
      return this.$store.state.Stream.selectedStreamId
    },
    selectedStream () {
      return Stream.find(this.selectedStreamId)
    },
    hasEditedData () {
      return this.name !== this.selectedStream.name || this.selectedLatitude !== this.selectedStream.latitude || this.selectedLongitude !== this.selectedStream.longitude
    }
  },
  methods: {
    onSelectLocation (coordinates) {
      console.log('coordinates', coordinates)
      this.selectedLongitude = coordinates[0]
      this.selectedLatitude = coordinates[1]
    },
    updateStream () {
      const latitude = this.selectedLatitude
      const longitude = this.selectedLongitude
      const name = this.name
      let listener = (event, arg) => {
        this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
        let idToken = arg
        let opts = {
          name: name,
          latitude: latitude,
          longitude: longitude
        }
        api
          .updateStream(this.isProductionEnv(), this.selectedStreamId, opts, idToken)
          .then(data => {
            console.log('stream coordinates is updated')
            Stream.update({ where: this.selectedStream.id,
              data: { latitude: latitude, longitude: longitude, name: name }
            })
            this.isLoading = false
            this.$router.push('/')
          })
          .catch(error => {
            console.log('error while updating stream coordinates', error)
            this.isLoading = false
            this.error = error.message || error.data
          })
      }
      this.isLoading = true
      this.$electron.ipcRenderer.send('getIdToken')
      this.$electron.ipcRenderer.on('sendIdToken', listener)
    },
    isProductionEnv () {
      return settings.get('settings.production_env')
    },
    getStreamCoordinates () {
      return this.selectedStream.longitude ? [this.selectedStream.longitude, this.selectedStream.latitude] : null
    }
  },
  mounted () {
    this.name = this.selectedStream.name || ''
  }
}
</script>

<style lang="scss">
.edit-stream {
  &__wrapper {
    margin: 32px auto;
    padding: $default-padding-margin;
    max-width: 500px;
  }
}
.map-wrapper {
  height: 300px;
  width: 500px;
  margin-bottom: $default-padding-margin;
  .mapboxgl-canvas {
    height: 300px !important;
  }
}
.notification {
  background: #3b3e53 !important;
  color: white;
}
.field-stream-location {
  position: relative;
}
</style>
