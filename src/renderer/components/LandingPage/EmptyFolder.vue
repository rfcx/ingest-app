<template>
    <div class="container-box empty has-text-centered">
        <img src="~@/assets/ic-folder-empty.svg" style="margin-bottom: 0.75em"><br>
        <span>Your synced folder is empty</span><br>
        <a class="button is-rounded is-primary" style="margin-top: 0.75em" @click="openFolder(selectedStream.folderPath)">Open Folder</a>
    </div>
</template>
<script>
  import { mapState } from 'vuex'
  import Stream from '../../store/models/Stream'
  export default {
    computed: {
      ...mapState({
        selectedStreamId: state => state.Stream.selectedStreamId
      }),
      selectedStream () {
        return Stream.find(this.selectedStreamId)
      }
    },
    methods: {
      openFolder (link) {
        console.log(link)
        this.$electron.shell.openItem(link)
      }
    }
  }
</script>
