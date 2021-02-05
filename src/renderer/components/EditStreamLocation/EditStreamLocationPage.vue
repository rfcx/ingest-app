<template>
  <div class="wrapper">
    <h1>Edit site</h1>
    <fieldset>
      <div class="notification default-notice" v-show="error">
        <button class="delete" @click="onCloseAlert()"></button>
        {{ error }}
      </div>
      <div class="field">
        <label for="name" class="label">Site name</label>
        <div class="control">
          <input v-model="name" class="input" type="text" placeholder="Jaguar 1" />
        </div>
      </div>
      <div class="field wrapper__location">
        <label for="location" class="label">Location</label>
        <Map class="map-wrapper" @locationSelected="onSelectLocation" :lngLat="getStreamCoordinates()"></Map>
      </div>
      <div class="wrapper__controls">
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
        <button type="button" class="button is-danger is-rounded is-outlined" :class="{'is-loading': isDeleting}" @click.prevent="showConfirmToDeleteStreamModal"><font-awesome-icon class="iconTrash" :icon="iconTrash"></font-awesome-icon> Delete Site</button>
      </div>
    </fieldset>
    <!-- Modal -->
    <div class="modal alert" :class="{ 'is-active': shouldShowConfirmToDeleteModal }">
      <div class="modal-background"></div>
      <div class="modal-card">
        <div class="modal-card-body">
          <p class="modal-card-title">Are you sure you want to delete this site?</p>
        </div>
        <footer class="modal-card-foot">
          <button class="button is-rounded" @click="hideConfirmToDeleteStreamModal()">Cancel</button>
          <button class="button is-danger is-rounded" :class="{ 'is-loading': isDeleting }" @click.prevent="deleteStream()">Delete</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import Stream from '../../store/models/Stream'
import File from '../../store/models/File'
import streamHelper from '../../../../utils/streamHelper'
import dateHelper from '../../../../utils/dateHelper'
import DatabaseEventName from '../../../../utils/DatabaseEventName'
import api from '../../../../utils/api'
import settings from 'electron-settings'
import Map from '../CreateStream/Map'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { mapState } from 'vuex'

export default {
  data () {
    return {
      name: 'edit-stream-location-page',
      selectedLatitude: null,
      selectedLongitude: null,
      isLoading: false,
      isDeleting: false,
      error: '',
      iconTrash: faTrash,
      shouldShowConfirmToDeleteModal: false
    }
  },
  components: { Map },
  computed: {
    ...mapState({
      selectedStreamId: state => state.Stream.selectedStreamId,
      currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId
    }),
    selectedStream () {
      return Stream.find(this.selectedStreamId)
    },
    hasEditedData () {
      return this.name !== this.selectedStream.name || this.selectedLatitude !== this.selectedStream.latitude || this.selectedLongitude !== this.selectedStream.longitude
    }
  },
  methods: {
    onSelectLocation (coordinates) {
      this.selectedLongitude = coordinates[0]
      this.selectedLatitude = coordinates[1]
    },
    updateStream () {
      if (!streamHelper.isValidName(this.name)) {
        this.error = streamHelper.getNameError(this.name)
        return
      }
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
          .then(async data => {
            console.log('stream coordinates is updated')
            Stream.update({
              where: this.selectedStream.id,
              data: { latitude: latitude, longitude: longitude, name: name }
            })
            this.updateFilesTimezone(dateHelper.getDefaultTimezone(latitude, longitude))
            this.isLoading = false
            this.redirectToMainScreen()
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
    async updateFilesTimezone (timezone) {
      let listen = (event, arg) => {
        this.$electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.updateFilesTimezoneResponse, listen)
        console.log('updateFilesTimezone completed')
      }
      const params = { streamId: this.selectedStreamId, timezone: timezone }
      this.$electron.ipcRenderer.send(DatabaseEventName.eventsName.updateFilesTimezoneRequest, params)
      this.$electron.ipcRenderer.on(DatabaseEventName.eventsName.updateFilesTimezoneResponse, listen)
    },
    showConfirmToDeleteStreamModal () {
      this.shouldShowConfirmToDeleteModal = true
    },
    hideConfirmToDeleteStreamModal () {
      this.shouldShowConfirmToDeleteModal = false
    },
    deleteStream () {
      this.error = null
      this.isDeleting = true
      let listener = (event, arg) => {
        this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
        let idToken = null
        idToken = arg
        api.deleteStream(this.isProductionEnv(), this.selectedStream.id, idToken).then(async (data) => {
          console.log('stream is deleted')
          await this.removeStreamFromVuex(this.selectedStream.id)
          this.modalHandler()
        }).catch(error => {
          console.log('error while deleting site', error)
          this.errorHandler(error, true)
        })
      }
      this.$electron.ipcRenderer.send('getIdToken')
      this.$electron.ipcRenderer.on('sendIdToken', listener)
    },
    async removeStreamFromVuex (selectedStreamId) {
      let ids = File.query().where('streamId', this.selectedStreamId).get().map((file) => { return file.id })
      if (ids && ids.length > 0) {
        let listen = (event, arg) => {
          this.$electron.ipcRenderer.removeListener(DatabaseEventName.eventsName.deleteAllFilesResponse, listen)
          console.log('files deleted')
          Stream.delete(selectedStreamId)
        }
        this.$electron.ipcRenderer.send(DatabaseEventName.eventsName.deleteAllFilesRequest, ids)
        this.$electron.ipcRenderer.on(DatabaseEventName.eventsName.deleteAllFilesResponse, listen)
      } else {
        Stream.delete(selectedStreamId)
      }
    },
    modalHandler () {
      const stream = Stream.query().where((stream) => {
        return stream.id !== this.selectedStreamId
      }).first()
      if (stream) {
        this.$store.dispatch('setSelectedStreamId', stream.id)
      }
      // If a stream deleted when the uploading process was paused.
      const files = File.query().where('sessionId', this.currentUploadingSessionId).get()
      files.forEach(file => {
        File.update({ where: file.id,
          data: { paused: false }
        })
      })
      this.isDeleting = false
      this.redirectToMainScreen()
    },
    errorHandler (error, isDeleting) {
      this.isDeleting = false
      this.hideConfirmToDeleteStreamModal()
      setTimeout(() => {
        this.error = null
      }, 10000)
      if (error.status === 401 || error.data === 'UNAUTHORIZED') {
        this.error = 'You are not authorized.'
      } else if (error.status === 403) {
        this.error = `You don't have permissions to delete non-empty site.`
      } else { this.error = 'Error while deleting site.' }
    },
    redirectToMainScreen () {
      this.$router.push('/')
    },
    onCloseAlert () {
      this.error = null
    }
  },
  mounted () {
    this.name = this.selectedStream.name || ''
  },
  watch: {
    name (val, oldVal) {
      if (val === oldVal) return
      this.error = null
    }
  }

}
</script>

<style lang="scss" scoped>
  .wrapper {
    margin: $wrapper-margin;
    padding: $default-padding-margin;
    max-width: $wrapper-width;
    &__location {
      position: relative;
    }
    &__controls {
      display: flex;
      justify-content: space-between;
    }
  }
  .iconTrash {
    margin-right: 4px;
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
