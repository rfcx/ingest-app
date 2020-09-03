<template>
    <div class="container-box empty has-text-centered empty__wrapper">
        <img :src="stateIcon"><br>
        <span>{{ stateStatus }}</span>
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
  .empty__wrapper {
    position: absolute;
    top: 50%;
    left: 25%;
    right: 25%;
    transform: translateY(-50%);
  }
  
  span {
    width: 100px;
    white-space: pre-wrap;
    color: $secondary-text-color;
  }

  img {
    width: 40px;
    height: 40px;
    margin-bottom: $default-padding-margin;
  }

  .container-box.empty {
    margin: $default-padding-margin auto;
    padding: $default-padding-margin;
    max-width: 300px;
  }

</style>
