<template>
  <div class="stream-info-container">
    <div class="title-container">
      <div class="title-container-text" v-if="selectedStream && !isRenaming">
      <span class="stream-name">{{ selectedStream.name }}</span>
      <span v-if="!isSelectedStreamFailed" class="title-container-edit" title="Rename the site"><font-awesome-icon :icon="iconPencil" @click="renameStream()"></font-awesome-icon></span>
      </div>
      <div class="edit-container" v-if="isRenaming">
        <input class="input edit-container-item-input" v-model="newStreamName" type="text" placeholder="">
        <div class="edit-container-item-control">
          <button class="button is-rounded btn is-cancel" @click="cancel()">Cancel</button>
          <button class="button is-rounded is-primary btn" :class="{ 'is-loading': isLoading }" :disabled="!isNewStreamNameValid && (newStreamName && newStreamName.length > 0)" @click="saveStream()">Save</button>
          <span class="edit-container-error" v-show="error">{{ error }}</span>
        </div>
      </div>
      <div class="notification is-danger is-light notice file-list-notice" v-if="errorMessage">
        <strong>{{ errorMessage }}</strong>
      </div>
      <div class="dropdown is-right" :class="{ 'is-active': shouldShowDropDown }" @click="toggleDropDown()" title="The stream’s menu to help you delete, rename or redirect you to RFCx Client Stream Web App.">
        <div class="dropdown-trigger">
          <img src="~@/assets/ic-menu.svg" aria-haspopup="true" aria-controls="dropdown-menu">
        </div>
        <div class="dropdown-menu" id="dropdown-menu" role="menu">
          <div class="dropdown-content">
            <a href="#" title="Rename the stream" class="dropdown-item" @click="renameStream()">Rename</a>
            <a href="#" title="Redirect to Web App" class="dropdown-item" @click="redirectToStreamWeb()">Redirect to RFCx Client Stream Web App</a>
            <a href="#" title="Delete the stream" class="dropdown-item has-text-danger" @click="showConfirmToDeleteStreamModal()">{{ ((files && !files.length) || isFilesUploading) ? 'Delete' : 'Move to Trash List'}}</a>
          </div>
        </div>
      </div>
    </div>
    <div class="subtitle-container">
      <router-link title="Edit site location" to="/edit-stream-location">
        <img src="~@/assets/ic-pin.svg">
        <span v-if="selectedStream" class="file-list-span">{{ selectedStream.siteGuid || `${selectedStream.latitude}, ${selectedStream.longitude}` }}</span></router-link>
    </div>
    <!-- Modal -->
    <div class="modal alert" :class="{ 'is-active': shouldShowConfirmToDeleteModal }">
      <div class="modal-background"></div>
      <div class="modal-card">
        <div class="modal-card-body">
          <p class="modal-card-title">Are you sure you want to delete this stream?</p>
        </div>
        <footer class="modal-card-foot">
          <button class="button" @click="hideConfirmToDeleteStreamModal()">Cancel</button>
          <!-- :disabled="isDeleting" -->
          <button class="button is-danger" :class="{ 'is-loading': isDeleting }" @click="deleteStream()">Delete</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import Stream from '../../store/models/Stream'
import File from '../../store/models/File'
import api from '../../../../utils/api'
import settings from 'electron-settings'
import { mapState } from 'vuex'
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons'

export default {
  data () {
    return {
      iconPencil: faPencilAlt,
      isRenaming: false,
      newStreamName: '',
      shouldShowDropDown: false,
      error: null,
      errorMessage: null,
      isLoading: false,
      isDeleting: false,
      shouldShowConfirmToDeleteModal: false
    }
  },
  computed: {
    ...mapState({
      currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId
    }),
    selectedStreamId () {
      return this.$store.state.Stream.selectedStreamId
    },
    selectedStream () {
      return Stream.find(this.selectedStreamId)
    },
    isNewStreamNameValid: function () {
      return this.newStreamName.trim().length && this.newStreamName.trim().length >= 3 && this.newStreamName.trim().length <= 40
    },
    isSelectedStreamFailed () {
      let streams = Stream.query().with('files').where('$id', this.selectedStreamId).get()
      if (!streams) { return false } // no stream
      const allFiles = streams[0].files // files of that stream
      const failedItems = allFiles.filter(file => file.isError)
      if (allFiles.length > 0 && failedItems.length === allFiles.length) return true // all files are failed
      return false
    },
    files () {
      return File.query().where('streamId', this.selectedStreamId).get()
    },
    isFilesUploading () {
      let count = 0
      this.files.forEach(file => {
        if (file.state === 'waiting' || file.state === undefined || file.state === 'uploading') {
          count++
        }
      })
      if (count === this.files.length) return true
    }
  },
  methods: {
    getAllFilesInTheSession () {
      return File.query().where('sessionId', this.currentUploadingSessionId).get()
    },
    // Dropdown menu
    toggleDropDown () {
      this.shouldShowDropDown = !this.shouldShowDropDown
    },
    // Rename
    renameStream () {
      this.newStreamName = null
      this.isRenaming = true
      this.newStreamName = this.selectedStream.name
    },
    saveStream () {
      this.error = null
      this.$emit('error', null)
      this.isLoading = true
      let listener = (event, arg) => {
        this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
        let idToken = null
        idToken = arg
        api.renameStream(this.isProductionEnv(), this.selectedStream.id, this.newStreamName, this.selectedStream.siteGuid, idToken).then(data => {
          console.log('stream is updated')
          Stream.update({ where: this.selectedStream.id,
            data: { name: this.newStreamName }
          })
          this.isLoading = false
          this.isRenaming = false
        }).catch(error => {
          console.log('error while updating stream', error)
          this.isLoading = false
          if (error.status === 401 || error.data === 'UNAUTHORIZED') {
            this.error = 'You are not authorized.'
          } else { this.error = 'Error while updating stream.' }
        })
      }
      this.$electron.ipcRenderer.send('getIdToken')
      this.$electron.ipcRenderer.on('sendIdToken', listener)
    },
    cancel () {
      this.isRenaming = false
      this.newStreamName = null
      this.error = null
    },
    // Delete
    deleteStream () {
      this.errorMessage = null
      this.isDeleting = true
      let listener = (event, arg) => {
        this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
        let idToken = null
        idToken = arg
        if ((this.files && !this.files.length) || this.isFilesUploading) {
          api.deleteStream(this.isProductionEnv(), this.selectedStream.id, idToken).then(async (data) => {
            console.log('stream is deleted')
            await this.removeStreamFromVuex(this.selectedStream.id)
            this.modalHandler()
          }).catch(error => {
            console.log('error while deleting stream', error)
            this.errorHandler(error, true)
          })
        } else {
          api.moveToTrashStream(this.isProductionEnv(), this.selectedStream.id, idToken).then(async (data) => {
            console.log('stream is moved to the trash list')
            await this.removeStreamFromVuex(this.selectedStream.id)
            this.modalHandler()
          }).catch(async (error) => {
            console.log('Error while moving stream to trash', error)
            if (error.status === 404 || error.data === 'Stream with given guid not found.') {
              this.errorMessage = null
              await this.removeStreamFromVuex(this.selectedStream.id)
              this.modalHandler()
            } else this.errorHandler(error, false)
          })
        }
      }
      this.$electron.ipcRenderer.send('getIdToken')
      this.$electron.ipcRenderer.on('sendIdToken', listener)
    },
    async removeStreamFromVuex (selectedStreamId) {
      let ids = this.files.map((file) => { return file.id })
      if (ids && ids.length > 0) {
        let listen = (event, arg) => {
          this.$electron.ipcRenderer.removeListener('filesDeleted', listen)
          console.log('files deleted')
          Stream.delete(selectedStreamId)
        }
        this.$electron.ipcRenderer.send('deleteFiles', ids)
        this.$electron.ipcRenderer.on('filesDeleted', listen)
      } else {
        Stream.delete(selectedStreamId)
      }
    },
    showConfirmToDeleteStreamModal () {
      this.shouldShowConfirmToDeleteModal = true
    },
    hideConfirmToDeleteStreamModal () {
      this.shouldShowConfirmToDeleteModal = false
    },
    modalHandler () {
      const stream = Stream.query().where((stream) => {
        return stream.id !== this.selectedStreamId
      }).first()
      if (stream) {
        this.$store.dispatch('setSelectedStreamId', stream.id)
      }
      // If a stream deleted when the uploading process was paused.
      const files = this.getAllFilesInTheSession()
      files.forEach(file => {
        File.update({ where: file.id,
          data: { paused: false }
        })
      })
      this.isDeleting = false
      this.hideConfirmToDeleteStreamModal()
    },
    errorHandler (error, isDeleting) {
      this.isDeleting = false
      this.hideConfirmToDeleteStreamModal()
      setTimeout(() => {
        this.errorMessage = null
      }, 10000)
      if (error.status === 401 || error.data === 'UNAUTHORIZED') {
        this.errorMessage = 'You are not authorized.'
      } else if (error.status === 403) {
        this.errorMessage = `You don't have permissions to delete non-empty stream.`
      } else { this.errorMessage = isDeleting ? 'Error while deleting stream.' : 'Error while moving stream to trash.' }
    },
    // Go to Stream Web
    isProductionEnv () {
      return settings.get('settings.production_env')
    },
    redirectToStreamWeb () {
      console.log('user redirected to the Client Stream Web', this.selectedStream)
      let url = api.explorerWebUrl(this.isProductionEnv())
      if (this.selectedStream) {
        if (this.selectedStream.env) {
          url = api.explorerWebUrl(this.selectedStream.env !== 'staging', this.selectedStream.id)
        } else {
          url = api.explorerWebUrl(this.isProductionEnv(), this.selectedStream.id)
        }
      }
      this.$electron.shell.openExternal(url)
    }
  },
  watch: {
    error (newValue) {
      this.$emit('updateError', newValue)
    },
    errorMessage (newValue) {
      this.$emit('updateErrorMessage', newValue)
    },
    isLoading (newValue) {
      this.$emit('updateLoading', newValue)
    }
  }
}
</script>

<style lang="scss" scoped>

  .title-container-text {
    font-weight: $title-font-weight;
    margin-bottom: 6px !important;
    max-width: 80%;
  }

  .subtitle-container {
    font-size: $default-subtitle-font-size;
    font-stretch: normal;
    font-style: normal;
    line-height: normal;
    letter-spacing: normal;
    color: $secondary-text-color !important;
  }

  .file-list-span {
    color: $secondary-text-color !important;
  }

  .edit-container {
    vertical-align: middle !important;
    width: 595px !important;
  }

  .edit-container-error {
    margin-left: 3px;
    font-size: 12px;
    color: #a1a1a7;
    vertical-align: middle;
  }

  .edit-container-item-input {
    display: inline-block !important;
    vertical-align: middle !important;
    width: 40%;
    margin: $default-padding-margin;
    margin-left: 0;
    font-size: 14px !important;
  }

  .edit-container-item-control {
    display: inline-block !important;
    vertical-align: middle !important;
    width: 56% !important;
  }

  .title-container-edit {
    margin-left: 10px !important;
    color: #9B9B9B !important;
    font-size: 14px;
    cursor: pointer;
  }

</style>
