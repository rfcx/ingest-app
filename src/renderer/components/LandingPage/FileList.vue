<template>
  <span> {{ selectedStream.folderPath }} </span>
</template>

<script>
  import { mapState } from 'vuex'
  export default {
    computed: {
      ...mapState({
        selectedStream: state => state.Stream.selectedStream
      })
    }
  }
</script>
