<template>
  <div class="file-list" :class="{ 'spinner': files && files.length && isFilesReading }">
    <!-- <div class="stream-info-container">
      <div class="title-container">
        <div class="title-container-text" v-if="selectedStream && !isRenaming">
        <span class="stream-name">{{ selectedStream.name }}</span>
        <span v-if="!isSelectedStreamFailed" class="title-container-edit" title="Rename the stream"><font-awesome-icon :icon="iconPencil" @click="renameStream()"></font-awesome-icon></span>
        </div>
        <div class="edit-container" v-if="isRenaming">
          <input class="input edit-container-item-input" v-model="newStreamName" type="text" placeholder="">
          <div class="edit-container-item-control">
            <button class="button is-rounded btn btn-edit-cancel" @click="cancel()">Cancel</button>
            <button class="button is-rounded is-primary btn" :class="{ 'is-loading': isLoading }" :disabled="!isNewStreamNameValid && (newStreamName && newStreamName.length > 0)" @click="saveStream()">Save</button>
            <span class="edit-container-error" v-show="error">{{ error }}</span>
          </div>
        </div>
        <div class="notification is-danger is-light notice file-list-notice" v-if="errorMessage">
          <strong>{{ errorMessage }}</strong>
        </div>
        <div class="dropdown is-right" :class="{ 'is-active': shouldShowDropDown }" @click="toggleDropDown()" title="The stream’s menu to help you delete, rename or redirect you to RFCx Client Stream Web App. If you have any problems with recognition of your folder with audio you can click on 'Rescan the folder'">
          <div class="dropdown-trigger">
            <img src="~@/assets/ic-menu.svg" aria-haspopup="true" aria-controls="dropdown-menu">
          </div>
          <div class="dropdown-menu" id="dropdown-menu" role="menu">
            <div class="dropdown-content">
              <a href="#" title="Rename the stream" class="dropdown-item" @click="renameStream()">Rename</a>
              <a href="#" title="Rescan the folder" class="dropdown-item" @click="refreshStream()">Rescan the folder</a>
              <a href="#" title="Redirect to Web App" class="dropdown-item" @click="redirectToStreamWeb()">Redirect to RFCx Client Stream Web App</a>
              <a href="#" title="Delete the stream" class="dropdown-item has-text-danger" @click="showConfirmToDeleteStreamModal()">{{ ((files && !files.length) || isFilesUploading) ? 'Delete' : 'Move to Trash List'}}</a>
            </div>
          </div>
        </div>
      </div>
      <div class="subtitle-container">
        <img src="~@/assets/ic-pin.svg"><span v-if="selectedStream" class="file-list-span">{{ selectedStream.siteGuid }}</span>
        <img src="~@/assets/ic-timestamp.svg"><span v-if="selectedStream">{{ selectedStream.timestampFormat }}</span>
        <div class="folder-area" v-if="selectedStream" :class="{ 'btn-open-empty': isEmptyFolder() }">
          <a title="Open selected folder" v-show="!isEmptyFolder()" class="button is-circle btn-open" @click="openFolder(selectedStream.folderPath)">
            <img class="img-open-folder" src="~@/assets/ic-folder-open.svg">
          </a>
          {{ selectedStream.folderPath }}
        </div>
      </div>
    </div> -->
    <header-view @updateError="updateError" @updateErrorMessage="updateErrorMessage" @updateLoading="updateLoading"></header-view>
    <div v-show="isEmptyFolder()" class="container-box empty has-text-centered">
        <img src="~@/assets/ic-folder-empty.svg" style="margin-bottom: 0.75em"><br>
        <span>Your synced folder is empty</span><br>
        <a v-if="selectedStream" class="button is-rounded is-primary" style="margin-top: 0.75em" @click="openFolder(selectedStream.folderPath)">Open Folder</a>
    </div>
    <!-- <table v-show="!isEmptyFolder()" class="table file-list-table file-list-table_head is-hoverable" :class="{ 'lowerOpacity': files && files.length && isFilesReading }">
      <thead>
        <tr>
          <td class="file-list-table__cell file-list-table__cell_status"></td>
          <td class="file-list-table__cell file-list-table__cell_name">Name</td>
          <td class="file-list-table__cell file-list-table__cell_info">Timestamp</td>
          <td class="file-list-table__cell file-list-table__cell_controls">Duration</td>
          <td class="file-list-table__cell file-list-table__cell_controls">File size</td>
        </tr>
      </thead>
    </table> -->
    <table v-show="!isEmptyFolder()" class="table file-list-table is-hoverable" :class="{ 'lowerOpacity': files && files.length && isFilesReading }">
      <thead>
        <tr>
          <td class="file-list-table__cell file-list-table__cell_status"></td>
          <td class="file-list-table__cell file-list-table__cell_name">Name</td>
          <td class="file-list-table__cell file-list-table__cell_info">Timestamp</td>
          <td class="file-list-table__cell file-list-table__cell_controls">Duration</td>
          <td class="file-list-table__cell file-list-table__cell_controls">File size</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in files" :key="file.id" :class="{ 'file-disable': file.disabled }">
          <td class="file-status file-list-table__cell file-list-table__cell_status"><img :class="{ 'file-failed': file.state === 'failed' || file.state === 'duplicated' }" :src="getStateImgUrl(file.state)"><span class="file-status-state">{{ file.state }}</span></td>
          <td class="file-row file-list-table__cell file-list-table__cell_name" :class="{ 'is-error': isError(file.state) || isDuplicated(file.state)}" >{{ file.name }}</td>
          <td class="file-row file-list-table__cell file-list-table__cell_info" v-if="!isError(file.state) && !isDuplicated(file.state)">{{ getTimestamp(file) }}</td>
          <td colspan="2" class="is-error file-row file-list-table__cell file-list-table__cell_info" v-if="isError(file.state) || isDuplicated(file.state)">{{ file.stateMessage }}</td>
          <td class="file-row file-list-table__cell file-list-table__cell_controls" v-if="!isError(file.state) && !isDuplicated(file.state)">{{ file.fileDuration }}</td>
          <td class="file-row file-list-table__cell file-list-table__cell_controls" v-if="!isError(file.state) && !isDuplicated(file.state)">{{ file.fileSize }}</td>
          <td class="file-row file-row-icons file-list-table__cell file-list-table__cell_controls" v-if="isError(file.state) || isDuplicated(file.state)">
            <font-awesome-icon v-show="isError(file.state)" class="iconRedo" :icon="iconRedo" @click="repeatUploading(file.id)"></font-awesome-icon>
            <font-awesome-icon class="iconHide" :icon="iconHide" @click="toggleDisabled(file.id)"></font-awesome-icon>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
  import HeaderView from './HeaderView'
  import dateHelper from '../../../../utils/dateHelper'
  import File from '../../store/models/File'
  import Stream from '../../store/models/Stream'
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
  import { faRedo, faEyeSlash, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'

  export default {
    components: {
      FontAwesomeIcon, HeaderView
    },
    data () {
      return {
        iconHide: faEyeSlash,
        iconRedo: faRedo,
        faExternalLinkAlt: faExternalLinkAlt,
        fill: { color: ['#2FB04A'] },
        error: null,
        errorMessage: null,
        checkWaitingFilesInterval: null,
        isLoading: false
      }
    },
    computed: {
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
        let stream = Stream.query().with('files').where('$id', this.selectedStreamId).get()
        let count = 0
        if (stream) {
          stream[0].files.forEach(file => {
            if (file.state === 'failed' || file.state === 'duplicated') {
              count++
            }
          })
          if (count === stream[0].files.length) return true
        }
      },
      files () {
        return File.query().where('streamId', this.selectedStreamId).get().sort((fileA, fileB) => {
          return new Date(fileB.timestamp) - new Date(fileA.timestamp)
        }).sort((fileA, fileB) => {
          return this.getStatePriority(fileA) - this.getStatePriority(fileB)
        })
      },
      isFilesReading () {
        let count = 0
        this.files.forEach(file => {
          if (file.state === 'waiting' || file.state === undefined) {
            count++
          }
        })
        if (count === this.files.length) return true
      }
    },
    methods: {
      getStatePriority (file) {
        const state = file.state
        switch (state) {
          case 'waiting': return 0
          case 'uploading': return 1
          case 'ingesting': return 2
          case 'failed': return 3
          case 'duplicated': return 4
          case 'completed': return 5
        }
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
      isError (state) {
        return state === 'failed'
      },
      isDuplicated (state) {
        return state === 'duplicated'
      },
      isEmptyFolder () {
        return this.files && this.files.length === 0
      },
      openFolder (link) {
        this.$electron.ipcRenderer.send('focusFolder', link)
        if (this.files && this.files.length) {
          this.files.forEach((file) => {
            if (file.state === 'completed') {
              File.update({ where: file.id,
                data: { notified: true }
              })
            }
          })
        }
      },
      progress (event, progress, stepValue) {
        // console.log(stepValue)
      },
      progress_end (event) {
        // console.log('circle end')
      },
      getFile (fileId) {
        return new Promise((resolve, reject) => {
          const file = File.query().where((file) => {
            return file.id === fileId
          }).get()
          if (file != null) {
            resolve(file[0])
          } else {
            reject(new Error('Not found file'))
          }
        })
      },
      repeatUploading (fileId) {
        let listener = (event, idToken) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          return this.getFile(fileId)
            .then((file) => {
              console.log('failed file', file)
              this.$file.uploadFile(file, idToken)
            })
        }
        this.$electron.ipcRenderer.send('getIdToken')
        this.$electron.ipcRenderer.on('sendIdToken', listener)
      },
      toggleDisabled (id) {
        this.getFile(id).then((file) => {
          console.log('disabled file', file)
          this.updateDisabled(file)
        })
      },
      updateDisabled (file) {
        File.update({ where: file.id,
          data: { disabled: !file.disabled }
        })
      },
      updateError (error) {
        this.error = error
      },
      updateErrorMessage (errorMessage) {
        this.errorMessage = errorMessage
      },
      updateLoading (isLoading) {
        this.isLoading = isLoading
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

  .file-list {
    height: 100% !important;
    padding-top: 20px !important;
    background: rgb(19, 21, 37);
  }

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

  .dark-mode {
    thead td, thead th {
      color: $body-text-color-dark !important;
    }

    td.is-error {
      color: $body-text-color-dark;
    }
  }

  .stream-info-container {
    padding: 0 16px;
  }

  .stream-info-container .title-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .stream-info-container .title-container .dropdown {
    padding-left: $default-padding-margin;
    padding-right: $default-padding-margin;
    cursor: pointer;
  }

  .subtitle-container {
    width: 95%;
  }

  .file-list-span {
    margin-right: 6px !important;
  }

  .stream-info-container .subtitle-container img {
    width: 1em;
    height: 1em;
    padding-right: 0.25em;
  }

  .stream-info-container .dropdown.is-right .dropdown-menu {
    z-index: 100 !important;
    top: 25px;
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
    width: 595px !important;
  }

  .edit-container-error {
    margin-left: 3px;
    font-size: 10px;
    color: #a1a1a7;
    vertical-align: middle;
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
    color: #9B9B9B !important;
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
    max-width: 80%;
  }

  .title-container-text .stream-name {
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: Avenir;
    font-size: 14px;
    font-weight: 900;
    font-stretch: normal;
    font-style: normal;
    line-height: normal;
    letter-spacing: normal;
    color: #ffffff;
  }

  .folder-area {
   display: inline-block;
   vertical-align: top;
  }

  .btn-open {
    cursor: pointer;
    height: 25px !important;
  }

  .btn-open-empty {
    margin-left: 5px !important;
  }

  .spinner::after {
    -webkit-animation: spinAround 500ms infinite linear;
    animation: spinAround 500ms infinite linear;
    border: 3px solid #dbdbdb;
    border-radius: 290486px;
    border-right-color: transparent;
    border-top-color: transparent;
    content: "";
    display: block;
    height: 3em;
    position: relative;
    width: 3em;
    left: calc(40% - (1em / 2));
    top: calc(50% - (1em / 2));
    position: absolute !important;
  }

  .lowerOpacity {
    opacity: 0.3;
  }

  .iconRedo {
    color: black;
    font-size: 13px;
    cursor: pointer;
  }

  .iconHide {
    vertical-align: middle;
    color: black;
    font-size: 13px;
    cursor: pointer;
    margin-left: 3px;
  }

  .file-row-icons {
    text-align: center !important;
  }

  .faExternal {
    color: #2FB04A;
    font-size: 24px;
    cursor: pointer;
  }

  .file-disable {
    opacity: 0.5;
  }

  .file-list-table {
    &_head {
      margin-bottom: 0 !important;
      .file-list-table {
        &__cell {
          white-space: nowrap;
        }
      }
    }
    &__cell {
      &_status {
        width: 10%;
      }
      &_name {
        width: 35%;
      }
      &_info {
        width: 10%;
      }
      &_controls {
        width: 15%;
        text-align: center !important;
      }
    }
  }

  .table tbody {
    overflow-y: auto !important;
  }

  .file-list-notice {
    left: 30% !important;
  }

  ::-webkit-scrollbar-thumb {
      background-color: gray;
  }
  ::-webkit-scrollbar-track {
    background-color: #52566e;
  }
  ::-webkit-scrollbar {
    width: 6px;
  }

</style>
