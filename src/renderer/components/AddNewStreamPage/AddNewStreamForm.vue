<template>
    <fieldset>
        <div class="notification" v-show="error">
          <button class="delete" @click="onCloseAlert()"></button>
          {{ error }}
        </div>
        <div class="field">
            <label for="name" class="label">Name</label>
            <div class="control">
                <input v-model="name" class="input" type="text" placeholder="Jaguar 1">
            </div>
        </div>
        <label for="folderPath" class="label">Folder path</label>
        <div class="field has-addons">
          <div class="control is-expanded">
            <input v-model="folderPath" class="input" type="text" placeholder="">
          </div>
          <div class="control"><a class="button is-light" @click="$refs.file.click()">Browse</a></div>
        </div>
        <div class="field file has-name is-right is-fullwidth" style="display: none">
            <label class="file-label">
                <input class="file-input" type="file" ref="file" name="resume" v-on:change="onFileChange($event)" webkitdirectory directory multiple/>
                <span class="file-cta">
                    <span class="file-label">Browse</span>
                </span>
                <span class="file-name">{{folderPath}}</span>
            </label>
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
        <div class="field" v-if="isCustomTimestampFormatSelected(timestampFormat)">
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
                <router-link to="/"><button class="button is-rounded">Cancel</button></router-link>
            </p>
            <p class="control">
                <button class="button is-rounded is-primary" :class="{ 'is-loading': isLoading }" :disabled="!hasPassedValidation" @click.prevent="createStream">Create</button>
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

export default {
  data () {
    return {
      name: null,
      folderPath: null,
      timestampFormat: 'Auto-detect',
      customTimestampFormat: '',
      timestampFormatOptions: ['Auto-detect', '%Y%M%D-%H%m%s', '%Y%M%D?%H:%m:%s', 'Custom'],
      error: null,
      isLoading: false,
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
    onFileChange (event) {
      const file = event.target.files[0]
      if (file) this.folderPath = file.path
      console.log(file)
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
    createStream () {
      if (this.checkIfDuplicateStream(this.folderPath)) {
        console.log('duplicate name')
        this.error = 'You have already linked to this folder. Please select a different folder.'
        return false
      }
      if (!this.checkIfDirectoryIsExist(this.folderPath)) {
        this.error = 'The directory is not exist.'
        return false
      }
      this.isLoading = true
      api.createStream(this.isProductionEnv(), this.name).then(streamId => {
        this.isLoading = false
        const stream = {
          id: streamId,
          name: this.name,
          folderPath: this.folderPath,
          timestampFormat: this.selectedTimestampFormat
        }
        console.log('creating stream')
        console.log(JSON.stringify(stream))
        Stream.insert({ data: stream, insert: ['files'] })
        this.$store.dispatch('setSelectedStreamId', stream.id)
        this.$router.push('/')
      }).catch(error => {
        console.log(error)
        this.isLoading = false
        this.error = error.message
      })
    },
    isProductionEnv () {
      return settings.get('settings.production_env')
    }
  },
  computed: {
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
      if (this.name && this.folderPath) {
        if (this.timestampFormat.toLowerCase() === 'custom' && this.customTimestampFormat) {
          return true
        } else if (this.timestampFormat.toLowerCase() !== 'custom') {
          return true
        }
        return false
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
  }
}
</script>

<style>

    .has-addons .input-control {
        width: -webkit-fill-available;
    }

    .file.is-fullwidth .file-name {
        max-width: 23.5em !important;
    }

    .tag.is-disabled {
      color: gray;
    }
</style>
