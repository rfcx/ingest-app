<template>
  <div class="container empty has-text-centered">
    <img :src="stateIcon" class="container__state-icon"><br>
    <span class="container__state-status">{{ stateStatus }}</span>
  </div>
</template>

<script>
  const dropFileDefaultMessage = 'Drop audio files here and press start upload to start uploading the audio files to the site.'
  export default {
    props: {
      isDragging: Boolean,
      hasFileInQueued: Boolean
    },
    computed: {
      stateStatus () {
        if (this.hasFileInQueued) {
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
    }
  }
</script>

<style lang="scss" scoped>
  .container {
    margin: 16px auto;
    padding: 16px;
    max-width: 500px;
    &__state-icon {
      width: 40px;
      height: 40px;
      margin-bottom: $default-padding-margin;
    }
    &__state-status {
      width: $full-width;
      white-space: pre-wrap;
    }
  }
  .container.empty {
    margin: $default-padding-margin auto;
    padding: $default-padding-margin;
    max-width: 300px;
  }
</style>
