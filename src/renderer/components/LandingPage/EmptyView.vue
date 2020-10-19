<template>
  <div class="centered-block has-text-centered">
      <img :src="stateIcon" class="container__state-icon"><br>
      <span class="container__state-status">{{ stateStatus }}</span>
      <button class="button is-rounded is-primary container__button" v-if="!isEmptyStream">
        Import files
        <input class="file-input" type="file" ref="file" v-on:change="importFiles($event)" multiple/>
      </button>
  </div>
</template>

<script>
const dropFileDefaultMessage = 'Drop or import audio files here and press start upload to start uploading them to the site.'
export default {
  props: {
    isDragging: Boolean,
    hasFileInQueued: {
      type: Boolean,
      default: false
    },
    isEmptyStream: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    stateStatus () {
      if (this.isEmptyStream) { // has no stream
        return 'Use + button to create your first site and start uploading files.'
      } else if (this.hasFileInQueued) {
        return 'Your audio is being uploaded.\n\nYou can still drop files here to upload more!'
      }
      return dropFileDefaultMessage
    },
    stateIcon () {
      if (this.isDragging) {
        return require('../../assets/ic-file-fill.svg')
      }
      if (this.hasFileInQueued) {
        return require('../../assets/ic-queuing.gif')
      }
      return require('../../assets/ic-file.svg')
    }
  },
  methods: {
    importFiles (e) {
      console.log('importFiles', e.target.files)
      this.$emit('onImportFiles', e.target.files)
    }
  }
}
</script>

<style lang="scss" scoped>
  .container {
    margin: 16px auto;
    padding: $default-padding;
    max-width: $wrapper-width;
    &__state-icon {
      width: 40px;
      height: 40px;
      margin-bottom: $default-padding-margin;
    }
    &__state-status {
      width: $full-width;
      white-space: pre-wrap;
      color: $secondary-text-color;
    }
    &__button {
      margin: $default-padding-margin auto;
      display: block;
    }
  }
</style>
