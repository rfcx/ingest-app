<template>
  <fieldset class="fieldset__wrapper">
    <div class="notification" v-show="error">
      <button class="delete" @click="onCloseAlert()"></button>
      {{ error }}
    </div>
    <div class="field field-stream-name">
      <label for="name" class="label">Stream name</label>
      <div class="control">
        <input v-model="name" class="input" type="text" placeholder="Jaguar 1" />
      </div>
    </div>
    <div class="field field-stream-name">
      <label for="location" class="label">Location</label>
      <Map @locationSelected="onSelectLocation"></Map>
    </div>
    <div class="field is-grouped">
      <p class="control control-btn">
        <router-link class="control-btn" to="/">
          <button type="button" class="button is-rounded cancel">Cancel</button>
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
</template>

<script>
import Stream from '../../store/models/Stream'
import api from '../../../../utils/api'
import settings from 'electron-settings'
import Map from './Map'

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
    hasPassedValidation () {
      if (!(this.name && this.selectedLatitude && this.selectedLongitude)) {
        return false
      }
      return true
    }
  },
  methods: {
    onSelectLocation (coordinates) {
      console.log('on selected location: ', coordinates)
      this.selectedLongitude = coordinates[0]
      this.selectedLatitude = coordinates[1]
    },
    createStream () {
      // TODO: verify data
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
              visibility: visibility
            }
            console.log('creating stream', JSON.stringify(stream))
            Stream.insert({ data: stream, insert: ['files'] })
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
    }
  }
}
</script>

<style lang="scss" scoped>
.fieldset {
  &__wrapper {
    margin: 32px auto;
    padding: 16px;
    max-width: 500px;
  }
}
</style>