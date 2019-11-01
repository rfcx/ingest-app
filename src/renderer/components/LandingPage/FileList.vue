<template>
  <div>
    <div class="stream-info-container">
      <div class="title-container">
        <span>{{ selectedStream.name }} (_{{ selectedStream.id.substring(0, 4) }}) </span>
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
        <img src="~@/assets/ic-pin.svg"><span>Osa Conservation</span> 
        <img src="~@/assets/ic-timestamp.svg"><span>{{ selectedStream.timestampFormat }}</span>
      </div>
    </div>
    <div v-show="isEmptyFolder()" class="container-box empty has-text-centered">
        <img src="~@/assets/ic-folder-empty.svg" style="margin-bottom: 0.75em"><br>
        <span>Your synced folder is empty</span><br>
        <a class="button is-rounded is-primary" style="margin-top: 0.75em" @click="openFolder(selectedStream.folderPath)">Open Folder</a>
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
          <td v-show="!shouldShowProgress(file.state)"><img :src="getStateImgUrl(file.state)"></td>
          <td v-show="shouldShowProgress(file.state)">
            <vue-circle ref="files" :progress="file.progress" :size="14" line-cap="round" :fill="fill" :thickness="2" :show-percent="false" @vue-circle-progress="progress" @vue-circle-end="progress_end">
            </vue-circle>
          </td>
          <td :class="{ 'is-error': isError(file.state) }" >{{ file.name }}</td>
          <td v-show="!isError(file.state)">{{ getTimestamp(file) }}</td>
          <td v-show="!isError(file.state)">{{ file.fileSize }}</td>
          <td class="is-error" v-show="isError(file.state)">{{ file.stateMessage }}</td>
          <td v-show="isError(file.state)"></td>
        </tr>
      </tbody>
    </table>
    <a v-show="!isEmptyFolder()" class="button is-circle is-primary" @click="openFolder(selectedStream.folderPath)"><img src="~@/assets/ic-open.svg"></a>
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
  import VueCircle from 'vue2-circle-progress'

  export default {
    components: {
      VueCircle
    },
    data () {
      return {
        fill: { color: ['#2FB04A'] },
        shouldShowDropDown: false,
        shouldShowConfirmToDeleteModal: false
      }
    },
    computed: {
      ...mapState({
        selectedStreamId: state => state.Stream.selectedStreamId
      }),
      selectedStream () {
        return Stream.find(this.selectedStreamId)
      },
      files () {
        return File.query().where('streamId', this.selectedStreamId).orderBy('name').get()
      }
    },
    methods: {
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
        console.log('showDropDown')
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
        this.$store.dispatch('setSelectedStreamId', stream.id)
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
  }

  .stream-info-container .subtitle-container img {
    width: 1em;
    height: 1em;
    padding-right: 0.25em;
  }

  .modal-card-head, .modal-card-foot {
    border: 0px !important;
    background-color: white !important;
  }

  .modal-card-foot {
    padding-top: 0px !important;
  }

  .modal-card-title {
    margin-bottom: 0px !important;
    font-size: $default-font-size !important;
  }

</style>
