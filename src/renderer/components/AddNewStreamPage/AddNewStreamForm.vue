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
        <div class="field file has-name is-right is-fullwidth">
            <label class="file-label">
                <input class="file-input" type="file" name="resume" v-on:change="onFileChange($event)" webkitdirectory directory multiple/>
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
                <input v-model="customTimestampFormat" class="input" type="text" placeholder="YYYYMMDD-HH:mm:ss">
            </div>
            <p class="help" v-if="isCustomTimestampFormatSelected(timestampFormat)">{{ timestampPreview }} </p>
            <div class="field is-grouped is-grouped-multiline">
              <div class="control" v-for="option in customTimestampFormatOptions" :key="option.title">
                <div class="tags has-addons">
                  <a class="tag" @click="selectTag(option)">{{ option.title }}</a>
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

export default {
  data () {
    return {
      name: null,
      folderPath: null,
      timestampFormat: 'YYYYMMDD-HHmmss',
      customTimestampFormat: '',
      timestampFormatOptions: ['YYYYMMDD-HHmmss', 'YYYYMMDD?HH:mm:ss', 'Custom'],
      error: null,
      isLoading: false,
      customTimestampFormatOptions: [
        { title: 'Year (YYYY)', format: 'YYYY', isSelected: false },
        { title: 'Month (MM)', format: 'MM', isSelected: false },
        { title: 'Day (DD)', format: 'DD', isSelected: false },
        { title: 'Hour (HH)', format: 'HH', isSelected: false },
        { title: 'Minute (mm)', format: 'mm', isSelected: false },
        { title: 'Second (ss)', format: 'ss', isSelected: false }
      ]
    }
  },
  methods: {
    checkIfDuplicateStream (folderPath) {
      const streams = this.streams
      if (!streams) return false
      return (streams.filter(stream => stream.folderPath === folderPath).length > 0)
    },
    isCustomTimestampFormatSelected (timestampFormat) {
      return timestampFormat.toLowerCase() === 'custom'
    },
    onFileChange (event) {
      const file = event.target.files[0]
      if (file) this.folderPath = file.path
      this.error = null
      // FIXME: check timestamp for auto-detect option
    },
    onCloseAlert () {
      this.error = null
    },
    selectTag (option) {
      if (option.isSelected) return // check if selected already
      // change text in filename format input
      if (this.customTimestampFormat === null) this.customTimestampFormat = option.format
      this.customTimestampFormat = this.customTimestampFormat + option.format
    },
    removeTag (option) {
      // change text in filename format input
      this.customTimestampFormat = this.customTimestampFormat.replace(option.format, '')
    },
    createStream () {
      if (this.checkIfDuplicateStream(this.folderPath)) {
        console.log('duplicate name')
        this.error = 'You have already linked to this folder. Please select a different folder.'
        return false
      }
      this.isLoading = true
      api.createStream(this.name).then(streamId => {
        this.isLoading = false
        const stream = {
          id: streamId,
          name: this.name,
          folderPath: this.folderPath,
          timestampFormat: this.selectedTimestampFormat
        }
        console.log('create stream')
        console.log(JSON.stringify(stream))
        Stream.insert({ data: stream, insert: ['files'] })
        this.$store.dispatch('setSelectedStreamId', stream.id)
        this.$router.push('/')
      }).catch(error => {
        console.log(error)
        this.isLoading = false
        this.error = error.message
      })
    }
  },
  computed: {
    streams () {
      return Stream.all()
    },
    selectedTimestampFormat: function () {
      switch (this.timestampFormat) {
        case 'Auto-detect': return null // FIXME: Fix this
        case 'Custom': return this.customTimestampFormat
        default: return this.timestampFormat
      }
    },
    timestampPreview: function () { // FIXME: fix this
      if (!this.selectedTimestampFormat) return null
      console.log(this.selectedTimestampFormat)
      return moment().format(this.selectedTimestampFormat)
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
      // if there is a format exist in the input, then set option's isSelected to be true
      this.customTimestampFormatOptions.forEach(option => {
        option.isSelected = this.customTimestampFormat.includes(option.format)
      })
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
</style>
'