<template>
    <fieldset>
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
            <label for="timestampFormat" class="label">Timestamp format</label>
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
            <label for="customTimestampFormat" class="label">Custom timestamp format</label>
            <div class="control">
                <input v-model="customTimestampFormat" class="input" type="text" placeholder="YYYYMMDD-HH:mm:ss">
            </div>
            <p class="help" v-if="isCustomTimestampFormatSelected(timestampFormat)">{{ timestampPreview }} </p>
        </div>
        <div class="field is-grouped">
            <p class="control">
                <router-link to="/"><button class="button is-rounded">Cancel</button></router-link>
            </p>
            <p class="control">
                <button class="button is-rounded is-primary" :disabled="!hasPassedValidation" @click.prevent="createStream">Create</button>
            </p>
        </div>
    </fieldset>
</template>

<script>
import moment from 'moment'
import Stream from '../../store/models/Stream'
import cryptoJS from 'crypto-js'

export default {
  data () {
    return {
      name: null,
      folderPath: null,
      timestampFormat: 'YYYYMMDD-HHmmss',
      customTimestampFormat: null,
      timestampFormatOptions: ['YYYYMMDD-HHmmss', 'YYYYMMDD?HH:mm:ss', 'Custom']
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
      // TODO: check timestamp for auto-detect option
    },
    createStream () {
      if (this.checkIfDuplicateStream(this.folderPath)) {
        console.log('duplicate name')
        return false
      }

      const streamId = cryptoJS.MD5(this.folderPath).toString()
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
    }
  },
  computed: {
    streams () {
      return Stream.all()
    },
    selectedTimestampFormat: function () {
      switch (this.timestampFormat) {
        case 'Auto-detect': return null // TODO: Fix this
        case 'Custom': return this.customTimestampFormat
        default: return this.timestampFormat
      }
    },
    timestampPreview: function () {
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
