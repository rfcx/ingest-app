<template>
  <div id="app">
    <div class="notification is-danger is-light fixed-notice" v-if="!onLine">
      <strong>No Internet Connection</strong>
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
  import File from './store/models/File'
  import settings from 'electron-settings'
  import { mapState } from 'vuex'
  const isOnline = require('is-online')

  export default {
    name: 'rfcx-uploader',
    data () {
      return {
        onLine: navigator.onLine
      }
    },
    mounted () {
      window.addEventListener('online', this.updateOnlineStatus)
      window.addEventListener('offline', this.updateOnlineStatus)
    },
    computed: {
      ...mapState({
        currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId
      })
    },
    methods: {
      getAllFilesInTheSession () {
        return File.query().where('sessionId', this.currentUploadingSessionId).get()
      },
      updateOnlineStatus (e) {
        const { type } = e
        this.onLine = type === 'online'
        if (!this.onLine) {
          console.log('\nupdateOnlineStatus', this.onLine)
          this.updateUploadingProcess(this.onLine)
          settings.set('settings.onLine', this.onLine)
          this.checkAfterSuspended()
        } else {
          isOnline().then(online => {
            console.log('\nupdateOnlineStatus', online)
            this.updateUploadingProcess(online)
            settings.set('settings.onLine', online)
          })
        }
      },
      updateUploadingProcess (arg) {
        const files = this.getAllFilesInTheSession()
        files.forEach(file => {
          File.update({ where: file.id,
            data: { paused: !arg }
          })
        })
      },
      checkAfterSuspended () {
        return this.getSuspendedFiles()
          .then((files) => {
            if (files.length) {
              let listener = (event, arg) => {
                this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
                let idToken = arg
                for (let file of files) {
                  return this.$file.checkStatus(file, idToken, true)
                }
              }
              this.$electron.ipcRenderer.send('getIdToken')
              this.$electron.ipcRenderer.on('sendIdToken', listener)
            }
          })
      },
      getSuspendedFiles () {
        return new Promise((resolve, reject) => {
          let files = File.query().where(file => { return file.state === 'uploading' && file.uploadId !== '' && file.uploaded === false }).orderBy('timestamp').get()
          resolve(files != null ? files : [])
        })
      }
    }
  }
</script>

<style>
  @import "~bulma/css/bulma.css";

  .notification.is-danger {
    background-color: #c73b57 !important;
    padding-right: 1.5rem !important;
  }

</style>
