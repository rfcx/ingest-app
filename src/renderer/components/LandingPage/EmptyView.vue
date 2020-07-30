<template>
    <div class="container-box empty has-text-centered">
        <img :src="stateIcon" style="margin-bottom: 0.75em"><br>
        <!-- <p>No files in completed</p> -->
        <span>{{ stateStatus }}</span>
    </div>
</template>

<script>
  const dropFileDefaultMessage = 'Drop audio files here and press start upload to start uploading the audio files to the stream.'
  export default {
    props: {
      isDragging: Boolean,
      hasFileInQueued: Boolean
    },
    computed: {
      stateStatus () {
        if (this.hasFileInQueued) {
          return 'Your audios are being uploaded.\n\nYou can still drop files here to upload more!'
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
    // watch: {
    //   isDragging (value) {
    //     if (value === true) {
    //       this.imageUrl = require('../../assets/ic-file-fill.svg')
    //     } else {
    //       this.imageUrl = this.getStateIcon()
    //     }
    //   },
    //   queuingFiles (f1, f2) {
    //     console.log('p', f1, f2)
    //   }
    // }
  }
</script>

<style lang="scss" scoped>

  span {
    width: 100px;
    white-space: pre-wrap;
  }

  img {
    width: 40px;
    height: 40px;
  }

  .container-box.empty {
    margin: 16px auto;
    padding: 16px;
    max-width: 300px;
  }
  
</style>