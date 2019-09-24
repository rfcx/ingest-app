<template>
  <div>
    <span> {{ selectedStream.folderPath }} </span>
    <ul v-for="file in getFiles()" :key="file">
      <li> {{ file }} </li>
    </ul>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import fs from 'fs'

  export default {
    methods: {
      getFiles () {
        return fs.readdirSync(this.selectedStream.folderPath)
      }
    },
    computed: {
      ...mapState({
        selectedStream: state => state.Stream.selectedStream
      })
    }
  }
</script>
