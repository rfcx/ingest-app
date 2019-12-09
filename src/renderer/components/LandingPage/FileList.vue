<template>
  <div>
    <div class="stream-info-container">
      <div class="title-container">
        <div class="title-container-text" v-if="selectedStream && !isRenaming">
        <span>{{ selectedStream.name }} (_{{ selectedStream.id.substring(0, 4) }})</span>
        <span v-if="!isSelectedStreamFailed" class="title-container-edit" title="Rename the stream"><font-awesome-icon :icon="iconPencil" @click="renameStream()"></font-awesome-icon></span>
        </div>
        <div class="edit-container" v-if="isRenaming">
          <input class="input edit-container-item-input" v-model="newStreamName" type="text" placeholder="">
          <div class="edit-container-item-control">
            <button class="button is-rounded btn" @click="cancel()">Cancel</button>
            <button class="button is-rounded is-primary btn" :class="{ 'is-loading': isLoading }" :disabled="!isNewStreamNameValid && (newStreamName && newStreamName.length > 0)" @click="saveStream()">Save</button>
          </div>
        </div>
        <div class="dropdown is-right" :class="{ 'is-active': shouldShowDropDown }" @click="toggleDropDown()">
          <div class="dropdown-trigger">
            <img src="~@/assets/ic-menu.svg" aria-haspopup="true" aria-controls="dropdown-menu">
          </div>
          <div class="dropdown-menu" id="dropdown-menu" role="menu">
            <div class="dropdown-content">
              <!-- <a href="#" class="dropdown-item">Rename</a>
              <a class="dropdown-item">Change filename format</a>
              <hr class="dropdown-divider"> -->
              <a href="#" class="dropdown-item has-text-danger" @click="showConfirmToDeleteStreamModal()">Delete</a>
            </div>
          </div>
        </div>
      </div>
      <div class="subtitle-container">
        <img src="~@/assets/ic-pin.svg"><span v-if="selectedStream">{{ selectedStream.siteGuid }}</span>
        <img src="~@/assets/ic-timestamp.svg"><span v-if="selectedStream">{{ selectedStream.timestampFormat }}</span>
      </div>
    </div>
    <div v-show="isEmptyFolder()" class="container-box empty has-text-centered">
        <img src="~@/assets/ic-folder-empty.svg" style="margin-bottom: 0.75em"><br>
        <span>Your synced folder is empty</span><br>
        <a v-if="selectedStream" class="button is-rounded is-primary" style="margin-top: 0.75em" @click="openFolder(selectedStream.folderPath)">Open Folder</a>
    </div>
    <!-- <span class="has-text-weight-semibold"> {{ selectedStream.folderPath }} | {{ selectedStream.timestampFormat }} </span> -->
    <table v-show="!isEmptyFolder()" class="table is-hoverable">
      <thead>
        <tr>
          <td></td>
          <td>Name</td>
          <td>Timestamp</td>
          <td>File size</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in files" :key="file.id">
          <td class="file-status" v-show="!shouldShowProgress(file.state)"><img :class="{ 'file-failed': file.state === 'failed' }" :src="getStateImgUrl(file.state)"><span class="file-status-state">{{ file.state }}</span></td>
          <!-- <td v-show="shouldShowProgress(file.state)">
            <vue-circle ref="files" :progress="file.progress" :size="14" line-cap="round" :fill="fill" :thickness="2" :show-percent="false" @vue-circle-progress="progress" @vue-circle-end="progress_end">
            </vue-circle>
          </td> -->
          <td class="file-row" :class="{ 'is-error': isError(file.state) }" >{{ file.name }}</td>
          <td class="file-row" v-show="!isError(file.state)">{{ getTimestamp(file) }}</td>
          <td class="file-row" v-show="!isError(file.state)">{{ file.fileSize }}</td>
          <td class="is-error file-row" v-show="isError(file.state)">{{ file.stateMessage }}</td>
          <td class="file-row" v-show="isError(file.state)"></td>
        </tr>
      </tbody>
    </table>
    <a title="Open selected folder" v-show="!isEmptyFolder() && !isAllFilesWithError()" class="button is-circle" @click="openFolder(selectedStream.folderPath)"><img src="~@/assets/ic-folder-open.svg"></a>
    <!-- Modal -->
    <div class="modal alert" :class="{ 'is-active': shouldShowConfirmToDeleteModal }">
      <div class="modal-background"></div>
      <div class="modal-card">
        <div class="modal-card-body">
          <p class="modal-card-title">Are you sure to delete this stream?</p>
        </div>
        <footer class="modal-card-foot">
          <button class="button" @click="hideConfirmToDeleteStreamModal()">Cancel</button>
          <button class="button is-danger" @click="deleteStream()">Delete</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import dateHelper from '../../../../utils/dateHelper'
  import File from '../../store/models/File'
  import Stream from '../../store/models/Stream'
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
  import { faPencilAlt } from '@fortawesome/free-solid-svg-icons'
  import settings from 'electron-settings'
  import api from '../../../../utils/api'
  // import VueCircle from 'vue2-circle-progress'

  export default {
    components: {
      FontAwesomeIcon
      // VueCircle
    },
    data () {
      return {
        iconPencil: faPencilAlt,
        fill: { color: ['#2FB04A'] },
        shouldShowDropDown: false,
        shouldShowConfirmToDeleteModal: false,
        isRenaming: false,
        isLoading: false,
        newStreamName: ''
      }
    },
    computed: {
      ...mapState({
        selectedStreamId: state => state.Stream.selectedStreamId
      }),
      selectedStream () {
        console.log('FileList selectedStream', this.selectedStreamId)
        return Stream.find(this.selectedStreamId)
      },
      isNewStreamNameValid: function () {
        return this.newStreamName.trim().length && this.newStreamName.trim().length >= 3 && this.newStreamName.trim().length <= 40
      },
      isSelectedStreamFailed () {
        let stream = Stream.query().with('files').where('$id', this.selectedStreamId).get()
        let count = 0
        if (stream) {
          stream[0].files.forEach(file => {
            if (file.state === 'failed') {
              count++
            }
          })
          if (count === stream[0].files.length) return true
        }
      },
      files () {
        return File.query().where('streamId', this.selectedStreamId).orderBy('name').get()
      }
    },
    methods: {
      renameStream () {
        this.newStreamName = null
        this.isRenaming = true
        this.newStreamName = this.selectedStream.name
      },
      saveStream () {
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
          })
        }
        this.isLoading = true
        this.$electron.ipcRenderer.send('getIdToken')
        this.$electron.ipcRenderer.on('sendIdToken', listener)
      },
      cancel () {
        this.isRenaming = false
        this.newStreamName = null
      },
      getFiles () {
        return this.files
        // return fs.readdirSync(this.selectedStream.folderPath)
      },
      getStateImgUrl (state) {
        return require(`../../assets/ic-state-${state}.svg`)
      },
      getTimestamp (file) {
        const isoDate = file.timestamp
        const momentDate = dateHelper.getMomentDateFromISODate(isoDate)
        const appDate = dateHelper.convertMomentDateToAppDate(momentDate)
        return appDate
      },
      isValid (date) {
        const momentDate = dateHelper.getMomentDateFromAppDate(date)
        return dateHelper.isValidDate(momentDate)
      },
      updateState (file, state) {
        File.update({ where: file.name,
          data: { state: state }
        })
      },
      shouldShowProgress (state) {
        return false
        // return state === 'uploading' || state === 'ingesting' || state === 'waiting'
      },
      isError (state) {
        return state === 'failed'
      },
      isAllFilesWithError () {
        let count = 0
        this.files.forEach(file => {
          if (file.state === 'failed') {
            count++
          }
        })
        if (count === this.files.length) return true
      },
      isEmptyFolder () {
        return this.files.length === 0
      },
      openFolder (link) {
        this.$electron.shell.openItem(link)
      },
      progress (event, progress, stepValue) {
        // console.log(stepValue)
      },
      progress_end (event) {
        // console.log('circle end')
      },
      toggleDropDown () {
        console.log('toggleDropDown')
        this.shouldShowDropDown = !this.shouldShowDropDown
      },
      showConfirmToDeleteStreamModal () {
        this.shouldShowConfirmToDeleteModal = true
      },
      hideConfirmToDeleteStreamModal () {
        this.shouldShowConfirmToDeleteModal = false
      },
      deleteStream () {
        // hide confirm modal
        this.hideConfirmToDeleteStreamModal()
        // delete files from current stream
        this.files.forEach(file => {
          File.delete(file.id)
        })
        // delete current stream
        Stream.delete(this.selectedStreamId)
        // select a new stream
        const stream = Stream.query().where((stream) => {
          return stream.id !== this.selectedStreamId
        }).first()
        if (stream) {
          this.$store.dispatch('setSelectedStreamId', stream.id)
        }
        // If a stream deleted when the uploading process was paused.
        this.$store.dispatch('setUploadingProcess', true)
      },
      isProductionEnv () {
        return settings.get('settings.production_env')
      }
    },
    watch: {
      files (newValue) {
        newValue.forEach((file, index) => {
          const filesRef = this.$refs.files
          if (filesRef === undefined) return
          const progress = filesRef[index]
          if (progress !== undefined) progress.updateProgress(file.progress)
        })
      }
    }
  }
</script>

<style lang="scss">

  thead {
    text-transform: uppercase;
    font-weight: $title-font-weight;
  }

  thead td, thead th {
    color: $body-text-color !important;
  }

  td.is-error {
    color: $body-text-color;
  }

  .stream-info-container {
    padding-left: $default-padding-margin;
    padding-right: $default-padding-margin;
    padding-bottom: $default-padding-margin;
  }

  .stream-info-container .title-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .stream-info-container .title-container span {
    font-weight: $title-font-weight;
  }

  .stream-info-container .title-container .dropdown {
    padding-left: $default-padding-margin;
    padding-right: $default-padding-margin;
    cursor: pointer;
  }

  .stream-info-container .subtitle-container img {
    width: 1em;
    height: 1em;
    padding-right: 0.25em;
  }

  .modal-card {
    text-align: center;
  }

  .modal-card-head, .modal-card-foot {
    border: 0px !important;
    background-color: white !important;
  }

  .modal-card-foot {
    justify-content: center !important;
    text-align: center;
    padding-top: 0px !important;
  }

  .modal-card-title {
    margin-bottom: 0px !important;
    font-size: $default-font-size !important;
  }

  .file-status-state {
    display: block;
    font-size: 8px;
    height: auto;
    line-height: 1 !important;
  }

  .file-status {
    text-align: center !important;
    padding: 0.4rem 0.75rem 0.7rem 0 !important;
    width: 73px !important;
  }

  .file-status img {
    display: block;
    margin: 0 auto;
  }

  .file-failed {
    margin: 7px auto 5px !important;
  }

  .file-row {
    vertical-align: middle !important;
  }

  .edit-container {
    vertical-align: middle !important;
    width: 500px !important;
  }

  .edit-container-item-input {
    display: inline-block !important;
    vertical-align: middle !important;
    width: 40% !important;
    margin-right: 10px !important;
    font-size: 12px !important;
  }

  .edit-container-item-control {
    display: inline-block !important;
    vertical-align: middle !important;
    width: 56% !important;
  }

  .title-container-edit {
    margin-left: 10px !important;
    color: grey;
    font-size: 14px;
    cursor: pointer;
  }

  .btn {
    width: 90px !important;
    height: 30px !important;
    line-height: 1 !important;
    margin-right: 8px !important;
    font-size: 12px !important;
  }

  .title-container-text {
    margin-bottom: 6px !important;
  }

</style>
