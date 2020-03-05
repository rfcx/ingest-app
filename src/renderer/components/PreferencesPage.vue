<template>
  <div class="preferences-popup" :class="{ 'dark-tray': isDark }">
    <div class="tabs">
      <ul>
        <li class="preferences-popup-tab" :class="{ 'is-active': (currentTab === 'update') }"><a @click="changeCurrentTab('update')">Update</a></li>
        <li class="preferences-popup-tab" :class="{ 'is-active': (currentTab === 'about') }"><a @click="changeCurrentTab('about')">About</a></li>
      </ul>
    </div>
    <div class="preferences-popup-update-wrapper" v-if="currentTab === 'update'">
      <div class="preferences-popup-update-auto">
        <div class="preferences-popup-update-auto-title">Check for updates automatically</div>
        <label class="checkbox preferences-popup-update-auto-checkbox preferences-popup-checkbox">
          <input type="checkbox" class="checkbox-form" v-model="isAutoUpdateApp" v-on:click="toggleDisabled()">
          <span class="checkbox-span">Enabled</span>
        </label>
        <div class="preferences-popup-update-auto-descr">RFCx Ingest automatically checks for new app versions, downloads then and installs on app's restart.</div>
      </div>
    </div>
    <div class="preferences-popup-about-wrapper" v-if="currentTab === 'about'">
      <img class="about-logo" src="~@/assets/rfcx-logo.png">
      <div class="about-app">RFCx Ingest</div>
      <div class="about-text" v-if="version">Version {{version}}</div>
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
        }),
        currentTab: 'update' | 'about',
        version: this.getVersion(),
        isAutoUpdateApp: null
      }
    },
    computed: {
      newVersion () {
        return remote.getGlobal('newVersion')
      }
    },
    methods: {
      changeCurrentTab (tab) {
        this.currentTab = tab
      },
      getVersion () {
        return remote.getGlobal('version')
      },
      toggleDisabled () {
        this.isAutoUpdateApp = !this.isAutoUpdateApp
        settings.set('settings.auto_update_app', this.isAutoUpdateApp)
        this.$electron.ipcRenderer.send('changeAutoUpdateApp')
      }
    },
    created () {
      console.log('Update page')
      this.isDark = settings.get('settings.darkMode')
      this.isAutoUpdateApp = settings.get('settings.auto_update_app')
      let html = document.getElementsByTagName('html')[0]
      if (html && this.isDark) {
        html.style.backgroundColor = '#131525'
      }
      this.currentTab = 'update'
    }
  }
</script>

<style lang="scss">

  .preferences-popup-update-wrapper {
    padding: 0 1em 1em;
  }

  .preferences-popup-update-auto {
    text-align: left;
  }

  .preferences-popup-update-auto-title {
    font-size: 14px;
    margin-bottom: 5px;
  }

  .preferences-popup-update-auto-checkbox {
    margin-bottom: 5px;
  }

  .preferences-popup-update-auto-descr {
    font-size: 14px;
    margin-bottom: 10px;
    opacity: 0.5;
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

  .preferences-popup-tab a {
    color: #000 !important;
  }

  .preferences-popup-tab.is-active {
    color: #2FB04A !important;
  }

  .preferences-popup-about-wrapper {
    text-align: center;
    margin: auto;
    padding: 20px;
    overflow: hidden;
  }

  .preferences-popup-checkbox {
    &:hover,
    &:active {
      color: #000;
    }
  }

  .dark-tray {
    background-color: #131525 !important;
    color: #fff !important;
    .preferences-popup-tab a {
      color: #fff !important;
    }
    .preferences-popup-checkbox {
      &:hover,
      &:active {
        color: #fff;
      }
    }
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
