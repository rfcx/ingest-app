<template>
  <fieldset class="fieldset__wrapper">
    <div class="notification" v-show="error">
      <button class="delete" @click="onCloseAlert()"></button>
      {{ error }}
    </div>
    <div class="field field-stream-location">
      <label for="location" class="label">Edit Stream Location</label>
      <Map class="map-wrapper" @locationSelected="onSelectLocation" :title="getStreamTitle()" :lngLat="getStreamCoordinates()"></Map>
    </div>
    <div class="field is-grouped">
      <p class="control control-btn">
        <router-link class="control-btn" to="/">
          <button type="button" class="button is-rounded is-primary" :class="{ 'is-loading': isLoading }">Done</button>
        </router-link>
      </p>
    </div>
  </fieldset>
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
      hasPassValidation: false,
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
    }
  },
  methods: {
    onSelectLocation (coordinates) {
      console.log('coordinates', coordinates)
      this.selectedLongitude = coordinates[0]
      this.selectedLatitude = coordinates[1]
      this.updateStream()
    },
    updateStream () {
      const latitude = this.selectedLatitude
      const longitude = this.selectedLongitude
      let listener = (event, arg) => {
        this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
        let idToken = arg
        let opts = {
          latitude: latitude,
          longitude: longitude
        }
        api
          .updateStream(this.isProductionEnv(), this.selectedStreamId, opts, idToken)
          .then(data => {
            console.log('stream coordinates is updated')
            Stream.update({ where: this.selectedStream.id,
              data: { latitude: latitude, longitude: longitude }
            })
            this.isLoading = false
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
    },
    getStreamTitle () {
      return this.selectedStream.name ? this.selectedStream.name : 'No name'
    }
  }
}
</script>

<style lang="scss">
.fieldset {
  &__wrapper {
    margin: 32px auto;
    padding: 16px;
    max-width: 500px;
  }
}
.map-wrapper {
  height: 300px;
  width: 500px;
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
