<template>
    <fieldset class="fieldset-wrap" :class="{ 'spinner': isLoading && isMultipleUpload, 'disabled': isLoading && isMultipleUpload }">
        <div class="notification" v-show="error">
          <button class="delete" @click="onCloseAlert()"></button>
          {{ error }}
        </div>
        <label for="folderPath" class="label" v-if="!isMultipleUpload">Folder path</label>
        <div class="field has-addons" v-if="!isMultipleUpload">
          <div class="control is-expanded">
            <input v-model="folderPath" class="input" type="text" placeholder="">
          </div>
          <div class="control"><a class="button is-light" @click="$refs.file.click(); focusWindow()">Browse</a></div>
        </div>
        <div class="field file has-name is-right is-fullwidth" style="display: none" v-if="!isMultipleUpload">
            <label class="file-label">
                <input class="file-input" type="file" ref="file" name="resume" v-on:change="onFileChange($event)" webkitdirectory directory multiple/>
                <span class="file-cta">
                    <span class="file-label">Browse</span>
                </span>
                <span class="file-name">{{folderPath}}</span>
            </label>
        </div>
        <div class="field field-stream-name" v-if="!isMultipleUpload">
          <a class="button-link-form" v-if="isAddingToExistingStream" @click="getExistingStreams()">+ Add to existing stream</a>
          <a class="button-link-form" v-if="!isAddingToExistingStream" @click="addToNewStream()">+ Add to new stream</a>
          <label for="name" class="label" v-if="isAddingToExistingStream">Stream name</label>
          <div class="control" v-if="isAddingToExistingStream">
            <input v-model="name" class="input" type="text" placeholder="Jaguar 1">
          </div>
          <!-- <div class="control" v-if="!isAddingToExistingStream">
            <input v-model="existingStreamName" class="input" type="text" placeholder="Jaguar 1" disabled>
          </div> -->
        </div>
        <div class="field" v-if="!isAddingToExistingStream">
          <label class="label">Existing streams</label>
          <div class="control" v-click-outside="outside">
            <div class="dropdown-wrapper" :class="{ 'opened': isShow }">
              <button class="dropdown-toggle" type="button" v-on:click="toggleDropdown">
                <span class="dropdown-input">{{ existingStreams && existingStreams.length? (currentStream? currentStream.label : 'Select stream') : (isLoadingStreams ? 'Loading streams' : 'No existing streams') }}</span>
                <span class="dropdown-icon" v-show="!isShow && !isLoadingStreams"><font-awesome-icon :icon="iconDown"></font-awesome-icon></span>
                <span class="dropdown-icon" v-show="isShow && !isLoadingStreams"><font-awesome-icon :icon="iconUp"></font-awesome-icon></span>
                <span :class="{ 'small-spinner': isLoadingStreams }"></span>
              </button>
              <div class="dropdown-list" v-show="isShow">
                <div v-for="existingStream in existingStreams" :key="existingStream.label" class="dropdown-row">
                  <a class="dropdown-link" href="#" v-on:click="changeStream(existingStream)" :title="existingStream.label">{{ existingStream.label }}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="field" v-if="isAddingToExistingStream">
          <label class="label">Site</label>
          <div class="control" v-click-outside="outside">
            <div class="dropdown-wrapper" :class="{ 'opened': isShow }">
              <button class="dropdown-toggle" type="button" v-on:click="toggleDropdown">
                <span class="dropdown-input">{{ sites && sites.length ? (currentSite ? currentSite.label : 'Choose Site') : 'No sites' }}</span>
                <span class="dropdown-icon" v-show="!isShow"><font-awesome-icon :icon="iconDown"></font-awesome-icon></span>
                <span class="dropdown-icon" v-show="isShow"><font-awesome-icon :icon="iconUp"></font-awesome-icon></span>
              </button>
              <div class="dropdown-list" v-show="isShow">
                <div v-for="site in sites" :key="site.label" class="dropdown-row">
                  <a class="dropdown-link" href="#" v-on:click="changeValue(site)" :title="site.label">{{ site.label }}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="field">
            <label for="timestampFormat" class="label">Filename format</label>
            <div class="control">
                <div class="select is-fullwidth">
                    <select v-model="timestampFormat">
                    <option v-for="option in timestampFormatOptions" :key="option">{{ option }}</option>
                    </select>
                </div>
            </div>
          <p class="help" v-if="!isCustomTimestampFormatSelected(timestampFormat)">{{ timestampPreview }} </p>
        </div>
        <div class="field" v-if="isCustomTimestampFormatSelected(timestampFormat) && isAddingToExistingStream">
            <label for="customTimestampFormat" class="label">Custom filename format</label>
            <div class="control">
                <input v-model="customTimestampFormat" class="input" type="text" placeholder="%Y%M%D-%H%m%s">
            </div>
            <p class="help" v-if="isCustomTimestampFormatSelected(timestampFormat)">{{ timestampPreview }} </p>
            <div class="field is-grouped is-grouped-multiline">
              <div class="control" v-for="option in customTimestampFormatOptions" :key="option.title">
                <div class="tags has-addons">
                  <a class="tag" :class="{ 'is-disabled': option.isDisabled }" @click="selectTag(option)">{{ option.title }}</a>
                  <a class="tag is-delete" @click="removeTag(option)" v-show="option.isSelected"></a>
                </div>
              </div>
            </div>
        </div>
        <div class="field is-grouped">
          <p class="control">
            <router-link to="/"><button class="button is-rounded cancel">Cancel</button></router-link>
          </p>
          <p class="control" v-if="isAddingToExistingStream">
            <button class="button is-rounded is-primary" :class="{ 'is-loading': isLoading && !isMultipleUpload}" :disabled="!hasPassedValidation && !isMultipleUpload" @click.prevent="createStream">Create</button>
          </p>
          <p class="control" v-if="!isAddingToExistingStream">
            <button class="button is-rounded is-primary" :class="{ 'is-loading': isLoading }" :disabled="!hasPassedValidation" @click.prevent="addToStream">Add</button>
          </p>
        </div>
    </fieldset>
</template>

<script>
import moment from 'moment'
import Stream from '../../store/models/Stream'
import api from '../../../../utils/api'
import fileHelper from '../../../../utils/fileHelper'
import settings from 'electron-settings'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons'
const { remote } = window.require('electron')

export default {
  data () {
    return {
      iconUp: faChevronUp,
      iconDown: faChevronDown,
      name: null,
      existingStreamName: null,
      folderPath: null,
      timestampFormat: 'Auto-detect',
      customTimestampFormat: '',
      timestampFormatOptions: ['Auto-detect', '%Y%M%D-%H%m%s', '%Y%M%D?%H:%m:%s', 'Custom'],
      error: null,
      isShow: false,
      isLoading: false,
      isLoadingStreams: false,
      isMultipleUpload: false,
      currentSite: null,
      currentStream: null,
      idToken: null,
      isAddingToExistingStream: true,
      newStreamsPaths: [],
      existingStreams: [],
      allStreams: [],
      customTimestampFormatOptions: [
        { title: 'Year 4 digits (%Y)', format: '%Y', isSelected: false, isDisabled: false },
        { title: 'Year 2 digits (%y)', format: '%y', isSelected: false, isDisabled: false },
        { title: 'Month (%M)', format: '%M', isSelected: false, isDisabled: false },
        { title: 'Day (%D)', format: '%D', isSelected: false, isDisabled: false },
        { title: 'Hour (%H)', format: '%H', isSelected: false, isDisabled: false },
        { title: 'Minute (%m)', format: '%m', isSelected: false, isDisabled: false },
        { title: 'Second (%s)', format: '%s', isSelected: false, isDisabled: false }
      ]
    }
  },
  components: {
    FontAwesomeIcon
  },
  methods: {
    checkIfDuplicateStream (folderPath) {
      const streams = this.streams
      if (!streams) return false
      return (streams.filter(stream => stream.folderPath === folderPath).length > 0)
    },
    checkIfDirectoryIsExist (folderPath) {
      return fileHelper.isExist(folderPath)
    },
    isCustomTimestampFormatSelected (timestampFormat) {
      return timestampFormat.toLowerCase() === 'custom'
    },
    focusWindow () {
      this.$refs.file.focus()
    },
    onFileChange (event) {
      console.log('onFileChange', event)
      const file = event.target.files[0]
      if (file) this.folderPath = file.path
      console.log(file)
      let streamName = fileHelper.getFileNameFromFilePath(this.folderPath)
      if (streamName) {
        this.name = streamName
      }
      this.error = null
      // FIXME: check timestamp for auto-detect option
    },
    onCloseAlert () {
      this.error = null
    },
    selectTag (option) {
      if (option.isSelected || option.isDisabled) return // check if selected already
      // disable year
      if (option.format === '%Y') {
        this.customTimestampFormatOptions[1].isDisabled = true
      } else if (option.format === '%y') {
        this.customTimestampFormatOptions[0].isDisabled = true
      }
      // change text in filename format input
      if (this.customTimestampFormat === null) this.customTimestampFormat = option.format
      this.customTimestampFormat = this.customTimestampFormat + option.format
    },
    removeTag (option) {
      if (option.format === '%Y' || option.format === '%y') {
        this.customTimestampFormatOptions[0].isDisabled = false
        this.customTimestampFormatOptions[1].isDisabled = false
      }
      // change text in filename format input
      this.customTimestampFormat = this.customTimestampFormat.replace(option.format, '')
    },
    getIdToken () {
      let listener = (event, arg) => {
        this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
        this.idToken = null
        this.idToken = arg
      }
      this.$electron.ipcRenderer.send('getIdToken')
      this.$electron.ipcRenderer.on('sendIdToken', listener)
    },
    async createStream () {
      if (!this.isMultipleUpload) {
        if (this.checkIfDuplicateStream(this.folderPath)) {
          console.log('duplicate name')
          this.error = 'You have already linked to this folder. Please select a different folder.'
          return false
        }
        if (!this.checkIfDirectoryIsExist(this.folderPath)) {
          this.error = 'The directory is not exist.'
          return false
        }
        let listener = (event, arg) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          let idToken = null
          idToken = arg
          api.createStream(this.isProductionEnv(), this.name, this.currentSite.value, idToken).then(streamId => {
            this.isLoading = false
            const stream = {
              id: streamId,
              name: this.name,
              folderPath: this.folderPath,
              timestampFormat: this.selectedTimestampFormat,
              siteGuid: this.currentSite.value,
              env: this.isProductionEnv() ? 'production' : 'staging'
            }
            console.log('creating stream', JSON.stringify(stream))
            Stream.insert({ data: stream, insert: ['files'] })
            this.$store.dispatch('setSelectedStreamId', stream.id)
            // this.$store.dispatch('setUploadingProcess', true)
            this.$router.push('/')
          }).catch(error => {
            console.log('error while creating stream', error)
            this.isLoading = false
            this.error = error.message || error.data
          })
        }
        this.isLoading = true
        this.$electron.ipcRenderer.send('getIdToken')
        this.$electron.ipcRenderer.on('sendIdToken', listener)
      } else if (this.isMultipleUpload) {
        for (let i = 0; i < this.newStreamsPaths.length; i++) {
          let path = this.newStreamsPaths[i]
          this.isLoading = true
          this.folderPath = null
          this.name = null
          this.folderPath = path
          this.name = fileHelper.getFileNameFromFilePath(path)
          if (this.checkIfDuplicateStream(this.folderPath)) {
            console.log('duplicate name')
            this.error = 'You have already linked to this folder. Please select a different folder.'
            setTimeout(() => {
              return this.$router.push('/')
            }, 2000)
          }
          if (!this.checkIfDirectoryIsExist(this.folderPath)) {
            this.error = 'The directory is not exist.'
            setTimeout(() => {
              return this.$router.push('/')
            }, 2000)
          }
          let count = 0
          const createStreamsAsync = async () => {
            return api.createStream(this.isProductionEnv(), this.name, this.currentSite.value, this.idToken).then(streamId => {
              const stream = {
                id: streamId,
                name: this.name,
                folderPath: this.folderPath,
                timestampFormat: this.selectedTimestampFormat,
                siteGuid: this.currentSite.value,
                env: this.isProductionEnv() ? 'production' : 'staging'
              }
              console.log('creating stream', JSON.stringify(stream))
              Stream.insert({ data: stream, insert: ['files'] })
              this.$store.dispatch('setSelectedStreamId', stream.id)
              // For the last stream.
              if (this.newStreamsPaths[this.newStreamsPaths.length - 1] === path && count === 0) {
                count++
                this.isLoading = false
                this.$router.push('/')
              }
            }).catch(error => {
              console.log('error while creating stream', error)
              this.isLoading = false
              this.error = error.message
            })
          }
          await createStreamsAsync()
        }
      }
    },
    isProductionEnv () {
      return settings.get('settings.production_env')
    },
    changeValue (item) {
      this.unselectAllValues()
      item.selected = true
      this.currentSite = item
      console.log('currentSite', this.currentSite)
      this.isShow = false
    },
    // onKeyDown (event) {
    // TODO: chose a site by a key
    //   if (event.keyCode === 13) {
    //     let item = this.items.find((item) => {
    //       return item.selected === true
    //     })
    //     this.changeValue(item)
    //   }
    // },
    toggleDropdown () {
      this.isShow = !this.isShow
    },
    unselectAllValues () {
      this.sites.forEach((item) => {
        item.selected = false
      })
    },
    outside: function (e) {
      this.isShow = false
    },
    getSites () {
      let accessibleSites = remote.getGlobal('accessibleSites')
      let defaultSite = remote.getGlobal('defaultSite')
      let allSites = remote.getGlobal('allSites') || []
      console.log('accessibleSites', accessibleSites, 'defaultSite', defaultSite)
      if (defaultSite && accessibleSites) {
        if (accessibleSites.includes(defaultSite)) {
          let sites = accessibleSites.map((item) => {
            let obj = {
              label: (allSites.find(site => site.guid === item) || { name: item }).name,
              value: item,
              selected: item === defaultSite
            }
            return obj
          })
          this.getCurrentSite(sites)
          return sites
        }
      } else return defaultSite
    },
    getCurrentSite (sites) {
      let selectedSite = sites.filter((item) => {
        return item.selected === true
      })
      if (selectedSite && selectedSite.length === 1) {
        this.currentSite = selectedSite[0]
      }
    },
    addToNewStream () {
      this.isAddingToExistingStream = true
    },
    getExistingStreams () {
      this.isAddingToExistingStream = false
      this.isLoadingStreams = true
      let listener = (event, arg) => {
        this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
        api.getExistingStreams(this.isProductionEnv(), arg).then(items => {
          // Remove repeating streams
          items = items.filter((item, index) => {
            let duplicate = items.find((it, ind) => {
              return index !== ind && it.guid === item.guid
            })
            if (duplicate) {
              return false
            }
            let existing = this.streams.find((stream) => {
              return stream.id === item.guid
            })
            if (existing) {
              return false
            }
            return true
          })
          this.allStreams = items
          this.existingStreams = items.map((item) => {
            let obj = {
              label: item.name,
              value: item.guid,
              selected: false
            }
            return obj
          })
          this.isLoadingStreams = false
          console.log('existingStreams', this.existingStreams)
        })
      }
      this.$electron.ipcRenderer.send('getIdToken')
      this.$electron.ipcRenderer.on('sendIdToken', listener)
    },
    changeStream (item) {
      this.unselectAllValues()
      item.selected = true
      this.currentStream = item
      console.log('currentStream', this.currentStream)
      this.existingStreamName = this.currentStream.label
      this.isShow = false
    },
    addToStream () {
      if (this.checkIfDuplicateStream(this.folderPath)) {
        console.log('duplicate name')
        this.error = 'You have already linked to this folder. Please select a different folder.'
        return false
      }
      if (!this.checkIfDirectoryIsExist(this.folderPath)) {
        this.error = 'The directory is not exist.'
        return false
      }
      // Restore the stream in the local database
      this.allStreams.forEach((stream) => {
        if (stream.guid === this.currentStream.value) {
          let restoringStream = {
            id: stream.guid,
            name: stream.name,
            folderPath: this.folderPath,
            timestampFormat: this.selectedTimestampFormat,
            siteGuid: stream.site.guid,
            env: this.isProductionEnv() ? 'production' : 'staging'
          }
          console.log('restoring stream', JSON.stringify(restoringStream))
          Stream.insert({ data: restoringStream, insert: ['files'] })
          this.$store.dispatch('setSelectedStreamId', restoringStream.id)
          this.$router.push('/')
        }
      })
    }
  },
  computed: {
    sites () {
      return this.getSites()
    },
    streams () {
      return Stream.all()
    },
    selectedTimestampFormat: function () {
      switch (this.timestampFormat) {
        case 'Auto-detect': return 'Auto-detect'
        case 'Custom': return this.customTimestampFormat
        default: return this.timestampFormat
      }
    },
    timestampPreview: function () { // FIXME: fix this
      if (!this.selectedTimestampFormat) return null
      else if (this.selectedTimestampFormat === 'Auto-detect') return null
      const now = moment()
      // console.log(`now.minute: ${now.minute} now.format ${now.format('mm')}`)
      var text = this.selectedTimestampFormat.replace('%Y', now.format('YYYY'))
      text = text.replace('%y', now.format('YY'))
      text = text.replace('%M', now.format('MM'))
      text = text.replace('%D', now.format('DD'))
      text = text.replace('%H', now.format('HH'))
      text = text.replace('%m', now.format('mm'))
      text = text.replace('%s', now.format('ss'))
      return text
    },
    hasPassedValidation: function () {
      if (this.name && this.folderPath && this.isAddingToExistingStream) {
        if (this.timestampFormat.toLowerCase() === 'custom' && this.customTimestampFormat) {
          return true
        } else if (this.timestampFormat.toLowerCase() !== 'custom') {
          return true
        }
        return false
      } else if (!this.isAddingToExistingStream && this.existingStreamName && this.folderPath) {
        return true
      }
      return false
    }
  },
  watch: {
    customTimestampFormat () {
      // disable year
      // FIXME: refactor this
      if (this.customTimestampFormat.includes('%Y')) {
        this.customTimestampFormatOptions[1].isDisabled = true
      } else if (this.customTimestampFormat.includes('%y')) {
        this.customTimestampFormatOptions[0].isDisabled = true
      } else {
        this.customTimestampFormatOptions[0].isDisabled = false
        this.customTimestampFormatOptions[1].isDisabled = false
      }
      // if there is a format exist in the input, then set option's isSelected to be true
      this.customTimestampFormatOptions.forEach(option => {
        option.isSelected = this.customTimestampFormat.includes(option.format)
      })
    },
    folderPath () {
      this.error = null
    }
  },
  created () {
    console.log('query', this.$route.query)
    if (this.$route.query && this.$route.query.folderPath) {
      this.folderPath = this.$route.query.folderPath
      this.name = this.$route.query.name
    } else if (this.$route.query && this.$route.query.folderPaths) {
      this.newStreamsPaths = this.$route.query.folderPaths
      this.isMultipleUpload = true
      this.getIdToken()
      console.log('newStreamsPaths', this.newStreamsPaths)
    }
  }
}
</script>

<style lang="scss">

  .has-addons .input-control {
      width: -webkit-fill-available;
  }

  .file.is-fullwidth .file-name {
      max-width: 23.5em !important;
  }

  .tag.is-disabled {
    color: gray;
  }

  .dropdown-wrapper {
    display: block;
    max-width: 100%;
    position: relative;
    cursor: pointer;
  }

  .opened .dropdown-toggle {
    border-color: #2FB04A !important;
  }

  .dropdown-link {
    white-space: nowrap;
    font-size: 1rem;
    color: #363636;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 10px;
  }

  .dropdown-link:hover {
    background-color: rgb(233, 230, 230);
  }

  .dropdown-row {
    padding: 3px 0;
  }

  .dropdown-list {
    max-height: 117px;
    overflow: auto;
    width: 100%;
    position: absolute;
    display: block;
    background-color: white;
    padding: 8px 0;
    margin: 5px 0;
    box-shadow: 0 0 8px 0 rgba(0,0,0,.2);
    border: 0.1px solid #CACACA;
    z-index: 1000;
    cursor: pointer;
  }

  .dropdown-toggle {
    background-color: white;
    border: 1px solid #dbdbdb;
    border-radius: 4px;
    color: #363636;
    display: block;
    width: 100%;
    height: 36px;
    font-size: 1rem;
    text-align: left;
    outline: none !important;
    position: relative;
    padding-bottom: calc(0.375em - 1px);
    padding-left: calc(0.625em - 1px);
    padding-right: calc(0.625em - 1px);
    padding-top: calc(0.375em - 1px);
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    box-shadow: none;
  }

  .dropdown-toggle:hover {
    border-color: rgb(175, 177, 180);
  }

  .dropdown-input {
    width: 78%;
    vertical-align: middle;
    display: inline-block;
    cursor: pointer;
  }

  .dropdown-icon {
    width: 20%;
    font-size: 1rem;
    vertical-align: middle;
    display: inline-block;
    color: #2FB04A;
    text-align: right;
    cursor: pointer;
  }

  .dropdown-icon:hover {
    color: #6D6F72;
  }

  .fieldset-wrap.spinner::after,
  .small-spinner::after {
    -webkit-animation: spinAround 500ms infinite linear;
    animation: spinAround 500ms infinite linear;
    border: 3px solid #dbdbdb;
    border-radius: 290486px;
    border-right-color: transparent;
    border-top-color: transparent;
    content: "";
    display: block;
    height: 4em;
    position: relative;
    width: 4em;
    left: calc(50% - (1em / 2));
    top: calc(50% - (1em / 2));
    position: absolute !important;
  }

  .small-spinner::after {
    height: 1.5em;
    width: 1.5em;
    left: 93%;
    top: 5px;
  }

  .disabled {
    color: transparent !important;
    pointer-events: none;
    opacity: 0.3 !important;
  }

  .field-stream-name {
    position: relative;
  }

  .button-link-form {
    background-color: transparent;
    border-color: transparent;
    border: none;
    text-decoration: none;
    outline-color: transparent;
    position: absolute;
    right: 0;
    top: 5px;
    z-index: 100;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.5;
    cursor: pointer;
  }

  .button-link-form:hover {
    background-color: transparent;
    border-color: transparent;
    border: none;
    outline-color: transparent;
    text-decoration: none;
  }

  .notification {
    z-index: 1000;
  }

</style>
