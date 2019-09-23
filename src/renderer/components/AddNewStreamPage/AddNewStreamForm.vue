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
                <router-link to="/"><a class="button is-rounded">Cancel</a></router-link>
            </p>
            <p class="control">
                <a class="button is-rounded is-primary" :disabled="!hasPassedValidation" @click="createStream">Create</a>
            </p>
        </div>
    </fieldset>
</template>

<script>
import moment from 'moment'
import db from '../../../../utils/db'

export default {
  data () {
    return {
      name: null,
      folderPath: null,
      timestampFormat: 'Auto-detect',
      customTimestampFormat: null,
      timestampFormatOptions: ['Auto-detect', 'YYYYMMDD-HHmm', 'YYYYMMDDT?HH:mm:ss', 'Custom']
    }
  },
  methods: {
    isCustomTimestampFormatSelected (timestampFormat) {
      return timestampFormat.toLowerCase() === 'custom'
    },
    onFileChange (event) {
      const file = event.target.files[0]
      if (file) this.folderPath = file.path
      // TODO: check timestamp for auto-detect option
    },
    createStream () {
      const stream = {
        name: this.name,
        folderPath: this.folderPath,
        timestampFormat: this.selectedTimestampFormat,
        state: 'waiting',
        progress: 0
      }
      if (!db.checkIfDuplicateStream(stream.name, stream.folderPath)) {
        db.addNewStream(stream)
        this.$store.dispatch('SET_SELECTED_STREAM', stream)
        this.$router.push('/')
      } else {
        // TODO: show error
        console.log('duplicate name')
      }
    }
  },
  computed: {
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
