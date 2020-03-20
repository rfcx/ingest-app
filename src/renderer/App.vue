<template>
  <div id="app">
    <div class="notification is-danger is-light notice" v-if="!onLine">
      <strong>No Internet Connection</strong>
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
  import File from './store/models/File'
  import settings from 'electron-settings'
  const isOnline = require('is-online')

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
        if (!this.onLine) {
          console.log('\nupdateOnlineStatus', this.onLine)
          this.$store.dispatch('setUploadingProcess', this.onLine)
          settings.set('settings.onLine', this.onLine)
          this.checkAfterSuspended()
        } else {
          isOnline().then(online => {
            console.log('\nupdateOnlineStatus', online)
            this.$store.dispatch('setUploadingProcess', online)
            settings.set('settings.onLine', online)
          })
        }
      },
      checkAfterSuspended () {
        return this.getUploadingFiles()
          .then((files) => {
            if (files.length) {
              for (let file of files) {
                File.update({ where: file.id,
                  data: {state: 'waiting', uploadId: '', stateMessage: '', progress: 0, retries: 0}
                })
              }
            }
          })
      },
      getUploadingFiles () {
        return new Promise((resolve, reject) => {
          let files = File.query().where('state', 'uploading').orderBy('timestamp').get()
          resolve(files != null ? files : [])
        })
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
