<template>
    <div class="container-box empty has-text-centered">
        <img :src="imageUrl" style="margin-bottom: 0.75em"><br>
        <!-- <p>No files in completed</p> -->
        <span>Drop audio files here and press start upload to start uploading the audio files to the stream.</span>
    </div>
</template>

<script>
  import { mapState } from 'vuex'
  import Stream from '../../store/models/Stream'
  export default {
    props: {
      isDragging: Boolean
    },
    data () {
      return {
        imageUrl: require('../../assets/ic-file.svg')
      }
    },
    computed: {
      ...mapState({
        selectedStreamId: state => state.Stream.selectedStreamId
      }),
      selectedStream () {
        return Stream.find(this.selectedStreamId)
      }
    },
    watch: {
      isDragging (value) {
        if (value === true) {
          this.imageUrl = require('../../assets/ic-file-fill.svg')
        } else {
          this.imageUrl = require('../../assets/ic-file.svg')
        }
      }
    }
  }
</script>

<style lang="scss" scoped>

  span {
    width: 100px;
  }

  .container-box.empty {
    margin: 16px auto;
    padding: 16px;
    max-width: 300px;
  }
  
</style>