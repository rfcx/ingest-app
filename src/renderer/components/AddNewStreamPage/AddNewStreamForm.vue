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
        </div>
        <div class="field" v-if="isCustomTimestampFormatSelected(timestampFormat)">
            <label for="customTimestampFormat" class="label">Custom timestamp format</label>
            <div class="control">
                <input v-model="customTimestampFormat" class="input" type="text" placeholder="yyyymmdd-hh:MM:SS">
            </div>
        </div>
        <div class="field is-grouped">
            <p class="control">
                <router-link to="/"><a class="button is-rounded">Cancel</a></router-link>
            </p>
            <p class="control">
                <a class="button is-rounded is-primary" :disabled="!hasPassedValidation">Create</a>
            </p>
        </div>
    </fieldset>
</template>

<script>
export default {
  data () {
    return {
      name: null,
      folderPath: null,
      timestampFormat: 'Auto-detect',
      customTimestampFormat: null,
      timestampFormatOptions: ['Auto-detect', 'yyyymmdd-hhMM', 'yyyymmddThh:MM:SS', 'Custom']
    }
  },
  methods: {
    isCustomTimestampFormatSelected (timestampFormat) {
      return timestampFormat.toLowerCase() === 'custom'
    },
    onFileChange (event) {
      const file = event.target.files[0]
      if (file) this.folderPath = file.path
    }
  },
  computed: {
    hasPassedValidation () {
      if (this.name && this.folderPath) {
        console.log('name, folder')
        if (this.timestampFormat.toLowerCase() === 'custom' && this.customTimestampFormat) {
          console.log('name, folder, timestamp, custom')
          return true
        } else if (this.timestampFormat.toLowerCase() !== 'custom') {
          console.log('name, folder, timestamp')
          return true
        }
        return false
      }
      console.log('!name, !folder')
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
