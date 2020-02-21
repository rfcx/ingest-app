<template>
  <div id="app">
    <div class="notification is-danger is-light notice" v-if="!onLine">
      <strong>No Internet Connection</strong>
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'rfcx-ingest',
    data () {
      return {
        onLine: navigator.onLine
      }
    },
    mounted () {
      window.addEventListener('online', this.updateOnlineStatus)
      window.addEventListener('offline', this.updateOnlineStatus)
    },
    methods: {
      updateOnlineStatus (e) {
        const { type } = e
        this.onLine = type === 'online'
      }
    }
  }
</script>

<style>
  @import "~bulma/css/bulma.css";

  .notice {
    position: fixed !important;
    top: 0 !important;
    left: 40% !important;
    z-index: 1000 !important;
  }

  .notification.is-danger {
    background-color: #c73b57 !important;
    padding-right: 1.5rem !important;
  }

</style>
