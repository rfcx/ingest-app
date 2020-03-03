<template>
  <div class="update-popup" :class="{ 'dark-tray': isDark }">
    <div class="update-popup-title-wrapper">
     <span class="update-popup-title">{{ newVersion ? 'Update Available' : 'You use Latest Release'}}</span>
    </div>
    <div class="update-popup-content-wrapper">
      <div class="update-popup-version" v-if="notes">{{ newVersion }} (Latest)</div>
      <div class="update-popup-version" v-if="!notes">No updates</div>
      <div class="update-popup-notes">
        <vue-markdown v-if="notes">{{notes}}</vue-markdown>
      </div>
      <div class="update-popup-controls">
        <button class="button is-rounded btn-edit-cancel btn" @click="cancel()">Cancel</button>
        <button class="button is-rounded is-primary btn" :class="{ 'is-loading': isLoading }" :disabled="!newVersion" @click="update()">Update</button>
      </div>
    </div>
  </div>
</template>

<script>
  import settings from 'electron-settings'
  import VueMarkdown from 'vue-markdown'
  const { remote } = window.require('electron')

  export default {
    data () {
      return {
        isDark: null,
        notes: null,
        isLoading: false,
        darkThemeForm: settings.watch('settings.darkMode', (newValue, oldValue) => {
          this.isDark = newValue
          console.log('isDarkTheme', this.isDark)
          let html = document.getElementsByTagName('html')[0]
          if (html && this.isDark) {
            html.style.backgroundColor = '#131525'
          }
        })
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
      this.isDark = settings.get('settings.darkMode')
      let html = document.getElementsByTagName('html')[0]
      if (html && this.isDark) {
        html.style.backgroundColor = '#131525'
      }
      this.getNotes()
    }
  }
</script>

<style lang="scss">

  .update-popup-title-wrapper {
    padding: 10px 1em 10px;
    opacity: 0.5;
  }

  .update-popup-content-wrapper {
    padding: 5px 1em 1em;
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
    height: 160px;
    overflow: auto !important;
  }

  .update-popup-controls {
    text-align: right;
  }

  .update-popup {
    margin: auto;
    overflow: hidden;
    background-color: #ffffff !important;
    color: #000 !important;
  }

  .dark-tray {
    background-color: #131525 !important;
    color: #fff !important;
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
