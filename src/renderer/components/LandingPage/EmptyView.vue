<template>
  <div class="container-box empty has-text-centered empty-view">
    <img :src="stateIcon" class="empty-view__state-icon"><br>
    <span class="empty-view__state-status">{{ stateStatus }}</span>
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
  .container-box {
    margin: 16px auto;
    padding: 16px;
    max-width: 500px;
  }
  .empty-view {
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
  .container-box.empty {
    margin: $default-padding-margin auto;
    padding: $default-padding-margin;
    max-width: 300px;
  }
</style>
