<template>
  <div class="update-popup" :class="{ 'dark-tray': isDark }">
   <div class="update-popup-title">
     <span>{{ newVersion ? 'Update Available' : 'You use Latest Release'}}</span>
    </div>
   <div class="update-popup-version" v-if="notes">{{ newVersion }} (Latest)</div>
   <div class="update-popup-notes" v-if="notes">{{ notes }}</div>
   <div class="pdate-popup-controls">
      <button class="button is-rounded btn btn-edit-cancel" @click="cancel()">Cancel</button>
      <button class="button is-rounded is-primary btn" :class="{ 'is-loading': isLoading }" :disabled="!isNewStreamNameValid && (newStreamName && newStreamName.length > 0)" @click="saveStream()">Save</button>
      <span class="edit-container-error" v-show="error">{{ error }}</span>
    </div>
  </div>
</template>

<script>
  import settings from 'electron-settings'
  const { remote } = window.require('electron')

  export default {
    data () {
      return {
        isDark: null,
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
    computed: {
      newVersion () {
        return remote.getGlobal('newVersion')
      }
     },
    methods: {
      getNotes () {
        notes = remote.getGlobal('notes')
      }
    },
    created () {
      console.log('About page')
      this.isDark = settings.get('settings.darkMode')
      let html = document.getElementsByTagName('html')[0]
      if (html && this.isDark) {
        html.style.backgroundColor = '#131525'
      }
    }
  }
</script>

<style lang="scss">

  .update-popup-title {
    font-size: 16px;
    text-transform: uppercase;
    background-color: #000 !important;
    color: #fff !important;
  }

  .update-popup-version {
    font-size: 16px;
    font-weight: bold;
  }

  .update-popup-notes {
    font-size: 12px;
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
