<template>
  <div class="preferences-page">
    <div class="tabs">
      <ul>
        <li class="preferences-page__tab" :class="{ 'is-active': (currentTab === 'update') }"><a @click="changeCurrentTab('update')">Update</a></li>
        <li class="preferences-page__tab" :class="{ 'is-active': (currentTab === 'about') }"><a @click="changeCurrentTab('about')">About</a></li>
      </ul>
    </div>
    <div class="preferences-page__wrapper" v-if="currentTab === 'update'">
      <div class="preferences-page__content">
        <div class="preferences-page__title">Check for updates automatically</div>
        <label class="checkbox preferences-page__checkbox">
          <input type="checkbox" class="checkbox-form" v-model="isAutoUpdateApp" v-on:click="toggleDisabled()">
          <span class="checkbox-span">Enabled</span>
        </label>
        <div class="preferences-page__descr">RFCx Ingest automatically checks for new app versions, downloads then and installs on app's restart.</div>
      </div>
    </div>
    <!-- TODO: reuse component from About page -->
    <div class="preferences-page__about-wrapper" v-if="currentTab === 'about'">
      <img class="preferences-page__logo" src="~@/assets/rfcx-logo.png">
      <div class="preferences-page__title">RFCx Ingest</div>
      <div class="preferences-page__version" v-if="version">Version {{version}}</div>
    </div>
  </div>
</template>

<script>
  import settings from 'electron-settings'
  const { remote } = window.require('electron')

  export default {
    data () {
      return {
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
      this.isAutoUpdateApp = settings.get('settings.auto_update_app')
      this.currentTab = 'update'
    }
  }
</script>

<style lang="scss" scoped>
  .preferences-page {
    &__wrapper {
      padding: 0 1em 1em;
    }
    &__content {
      text-align: left;
    }
    &__title {
      font-size: 14px;
      margin-bottom: 5px;
    }
    &__checkbox {
      margin-bottom: 5px;
      &:hover,
      &:active {
        color: #fff;
      }
    }
    &__descr {
      font-size: 14px;
      margin-bottom: 10px;
      opacity: 0.5;
    }
    &__about-wrapper {
      text-align: center;
      margin: auto;
      padding: 20px;
      overflow: hidden;
    }
    &__logo {
      margin-top: 10px;
      width: 35px;
      height: 50px;
    }
    &__title {
      font-size: $default-font-size;
      margin: 5px auto;
    }
    &__version {
      font-size: 12px;
    }
    .update-page {
      margin: auto;
      overflow: hidden;
      &__controls {
        text-align: right;
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
  }
</style>
