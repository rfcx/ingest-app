<template>
  <div class="update-popup">
    <div class="update-popup-title-wrapper">
     <span class="update-popup-title">{{ newVersion ? 'Update Available' : 'You use Latest Release'}}</span>
    </div>
    <div class="update-popup-content-wrapper">
      <div class="update-popup-version" v-if="newVersion">{{ newVersion }} (Latest)</div>
      <div class="update-popup-version" v-if="!newVersion"></div>
      <div class="update-popup-notes">
        <vue-markdown v-if="notes">{{notes}}</vue-markdown>
      </div>
      <div class="update-popup-controls">
        <button class="button is-rounded btn-edit-cancel btn" @click="cancel()">{{ platform === 'mac' ? 'Cancel' : 'Install on quit' }}</button>
        <button class="button is-rounded is-primary btn" :class="{ 'is-loading': isLoading }" :disabled="!newVersion" @click="update()">Update now</button>
      </div>
    </div>
  </div>
</template>

<script>
  import VueMarkdown from 'vue-markdown'
  const { remote } = window.require('electron')

  export default {
    data () {
      return {
        notes: null,
        platform: null,
        isLoading: false
      }
    },
    components: { VueMarkdown },
    computed: {
      newVersion () {
        return remote.getGlobal('newVersion')
      }
    },
    methods: {
      getNotes () {
        this.notes = remote.getGlobal('notes')
      },
      cancel () {
        this.$electron.ipcRenderer.send('closeUpdatePopupWindow')
      },
      update () {
        this.isLoading = true
        this.$electron.ipcRenderer.send('updateVersion')
      }
    },
    created () {
      console.log('Update page')
      this.platform = remote.getGlobal('platform')
      this.getNotes()
    }
  }
</script>

<style lang="scss" scoped>

  .update-popup-title-wrapper {
    padding: 10px 1em 10px;
    opacity: 0.5;
  }

  .update-popup-content-wrapper {
    padding: 0px 1em 5px;
  }

  .update-popup-title {
    font-size: 14px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .update-popup-version {
    font-size: 16px;
    font-weight: bold;
  }

  .update-popup-notes {
    font-size: 12px;
    height: 140px;
    overflow: auto !important;
  }

  .update-popup-controls {
    text-align: right;
  }

  .update-popup {
    margin: auto;
    overflow: hidden;
  }

  ::-webkit-scrollbar-thumb {
    background-color: transparent;
  }
  ::-webkit-scrollbar-track {
    background-color: transparent;
  }
  ::-webkit-scrollbar {
    width: 1px;
  }

</style>
