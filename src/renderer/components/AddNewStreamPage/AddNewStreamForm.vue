<template>
    <fieldset>
        <div class="field">
            <label for="name" class="label">Name</label>
            <div class="control">
                <input v-model="name" class="input" type="text" placeholder="Jaguar 1">
            </div>
        </div>
        <label for="folderPath" class="label">Folder path</label>
        <div class="field has-addons">
            <p class="control input-control">
                <input v-model="folderPath" class="input" type="text" placeholder="/User/Documents/RFCx">
            </p>
            <p class="control">
                <a class="button">Browse</a>
            </p>
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
                <router-link to="/"><a class="button is-light">Cancel</a></router-link>
            </p>
            <p class="control">
                <a class="button is-primary">Create</a>
            </p>
        </div>
    </fieldset>
</template>

<script>
export default {
  data () {
    return {
      name: '',
      folderPath: '',
      timestampFormat: 'Auto-detect',
      customTimestampFormat: '',
      timestampFormatOptions: ['Auto-detect', 'yyyymmdd-hhMM', 'yyyymmddThh:MM:SS', 'Custom']
    }
  },
  methods: {
    isCustomTimestampFormatSelected: function (timestampFormat) {
      return timestampFormat.toLowerCase() === 'custom'
    }
  }
}
</script>

<style>
    .has-addons .input-control {
        width: -webkit-fill-available;
    }
</style>
