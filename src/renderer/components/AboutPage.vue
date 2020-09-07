<template>
  <div class="about">
    <img class="about-logo" src="~@/assets/rfcx-logo.png">
    <div class="about-app">RFCx Ingest</div>
    <div class="about-text" v-if="version">Version {{version}}</div>
    <div class="about-env is-size-7">({{getEnv()}})</div>
  </div>
</template>

<script>
  import settings from 'electron-settings'
  const { remote } = window.require('electron')

  export default {
    data () {
      return {
        version: this.getVersion()
      }
    },
    methods: {
      getVersion () {
        return remote.getGlobal('version')
      },
      getEnv () {
        return settings.get('settings.production_env') ? '' : 'staging'
      }
    }
  }
</script>

<style lang="scss" scoped>

  .about-logo {
    margin-top: 10px;
    width: 35px;
    height: 50px;
  }

  .about-app {
    font-size: $default-font-size;
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
