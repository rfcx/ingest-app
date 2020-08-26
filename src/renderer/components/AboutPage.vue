<template>
  <div class="about-page">
    <img class="about-page__logo" src="~@/assets/rfcx-logo.png">
    <div class="about-page__title">RFCx Ingest</div>
    <div class="about-page__version" v-if="version">Version {{version}}</div>
  </div>
</template>

<script>
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
      }
    }
  }
</script>

<style lang="scss">
  .about-page {
    text-align: center;
    margin: auto;
    padding: 20px;
    overflow: hidden !important;
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
