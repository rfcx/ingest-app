<template>
  <div class="landing__content-wrapper">
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
          <td class="file-list-table__cell file-list-table__cell_controls">Durations</td>
          <td class="file-list-table__cell file-list-table__cell_controls">File size</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in files" :key="file.id" :class="{ 'file-disable': file.disabled }">
          <td class="file-status file-list-table__cell file-list-table__cell_status"><img :class="{ 'file-failed': file.state === 'failed' || file.state === 'duplicated' }" :src="getStateImgUrl(file.state)"><span class="file-status-state">{{ file.state }}</span></td>
          <td class="file-row file-list-table__cell file-list-table__cell_name" :class="{ 'is-error': isError(file.state) || isDuplicated(file.state)}" >{{ file.name }}</td>
          <td class="file-row file-list-table__cell file-list-table__cell_info" v-if="!isError(file.state) && !isDuplicated(file.state)">{{ getTimestamp(file) }}</td>
          <td class="is-error file-row file-list-table__cell file-list-table__cell_info" v-if="isError(file.state) || isDuplicated(file.state)">{{ file.stateMessage }}</td>
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
  import dateHelper from '../../../../utils/dateHelper'
  import fileHelper from '../../../../utils/fileHelper'
  import File from '../../store/models/File'
  import Stream from '../../store/models/Stream'
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
  import { faPencilAlt, faRedo, faEyeSlash, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
  import fileWatcher from '../../../main/services/file-watcher'

  export default {
    components: {
      FontAwesomeIcon
    },
    data () {
      return {
        iconPencil: faPencilAlt,
        iconHide: faEyeSlash,
        iconRedo: faRedo,
        faExternalLinkAlt: faExternalLinkAlt,
        fill: { color: ['#2FB04A'] },
        shouldShowDropDown: false,
        shouldShowConfirmToDeleteModal: false,
        isRenaming: false,
        isLoading: false,
        isDeleting: false,
        newStreamName: '',
        error: null,
        errorMessage: null,
        checkWaitingFilesInterval: null
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
      renameStream () {
        this.newStreamName = null
        this.isRenaming = true
        this.newStreamName = this.selectedStream.name
      },
      async refreshStream () {
        let files = File.query().where('streamId', this.selectedStream.id).orderBy('name').get()
        console.log('files for refreshing stream', files)
        await this.checkFilesExistense(files)
        fileWatcher.subscribeStream(this.selectedStream)
      },
      async checkFilesExistense (files) {
        for (const file of files) {
          if (!fileHelper.isExist(file.path)) {
            await File.delete(file.id)
          }
        }
      },
      cancel () {
        this.isRenaming = false
        this.newStreamName = null
        this.error = null
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
      isError (state) {
        return state === 'failed'
      },
      isDuplicated (state) {
        return state === 'duplicated'
      },
      isEmptyFolder () {
        return this.files && this.files.length === 0
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
