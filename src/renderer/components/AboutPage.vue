<template>
  <div class="about" :class="{ 'dark-tray': isDark }">
   <img class="about-logo" src="~@/assets/rfcx-logo.png">
   <div class="about-app">Ingest App</div>
   <div class="about-text" v-if="version">Version {{version}}</div>
   <div class="about-text">Copyright © 2020 RFCx</div>
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
        }),
        version: this.getVersion()
      }
    },
    methods: {
      getVersion () {
        return remote.getGlobal('version')
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

  .about-logo {
    margin-top: 5px;
    width: 35px;
    height: 50px;
  }

  .about-app {
    font-size: 16px;
    margin: 5px auto;
  }

  .about-text {
    font-size: 12px;
  }

  .about {
    text-align: center;
    margin: auto;
    padding: 20px;
    overflow: hidden;
  }

  .dark-tray {
    background-color: #131525 !important;
    color: #fff !important;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #131525;
  }
  ::-webkit-scrollbar-track {
    background-color: #131525;
  }
  ::-webkit-scrollbar {
    width: 1px;
  }

</style>
