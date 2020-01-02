<template>
  <nav class="navbar is-fixed-top" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <div class="navbar-item">
        <router-link to="/"><img src="~@/assets/rfcx-logo.png" alt="rfcx"></router-link>
      </div>
      <span class="navbar-item">RFCx Ingest</span>
      <span class="navbar-item tag"
      :class="{ 'is-primary': productionEnv, 'is-dark': !productionEnv }"
      @click="switchEnvironment()">
        {{ productionEnv ? 'production' : 'staging' }}
      </span>
    </div>
    <div class="navbar-end">
      <div class="navbar-item">
        <div class="navbar-item user-info-nav">
          <div class="user-info-name"><span><span class="name">Hello, {{name}}!</span><br><span class="site-name">{{ siteName }}</span></span></div>
          <div class="dropdown is-right dropdown-nav" :class="{ 'is-active': shouldShowDropDown }" @click="toggleDropDown()">
            <div class="dropdown-trigger">
              <div class="user-info-image" aria-haspopup="true" aria-controls="dropdown-menu-nav"><img title="Menu" src="~@/assets/ic-profile-temp.svg" alt="rfcx" width="30" height="30"></div>
            </div>
            <div class="dropdown-menu dropdown-menu-navigation" id="dropdown-menu-nav" role="menu">
              <div class="dropdown-content">
                <a href="" class="dropdown-item has-text-danger" @click="logOut()">Log out</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal alert" :class="{ 'is-active': shouldShowAlert }">
      <div class="modal-background"></div>
      <div class="modal-card">
        <div class="modal-card-body">
          <p class="modal-card-title">Please wait until the current uploading process is finished before changing the environment.</p>
        </div>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="hideAlert()">OK</button>
        </footer>
      </div>
    </div>
  </nav>
</template>

<script>
  import File from '../../store/models/File'
  import settings from 'electron-settings'
  const { remote } = window.require('electron')

  export default {
    data () {
      return {
        name: this.getUserName(),
        siteName: this.getSite(),
        shouldShowAlert: false,
        shouldShowDropDown: false,
        productionEnv: this.isProductionEnv()
      }
    },
    computed: {
      getUnsyncedFiles () {
        return File.query().where('state', 'waiting').orderBy('timestamp').get()
      },
      getUploadedFiles () {
        return File.query().where((file) => {
          return file.state === 'ingesting' && file.uploadId !== ''
        }).orderBy('timestamp').get()
      },
      isInprogessOfUploading () {
        return this.getUnsyncedFiles.length > 0 || this.getUploadedFiles.length > 0
      }
    },
    methods: {
      switchEnvironment () {
        if (this.isInprogessOfUploading) {
          this.shouldShowAlert = true
          return
        }
        settings.set('settings.production_env', !this.isProductionEnv())
        this.productionEnv = this.isProductionEnv()
      },
      isProductionEnv () {
        return settings.get('settings.production_env')
      },
      getUserName () {
        let userName = remote.getGlobal('firstname')
        if (userName) return userName
        else return 'Awesome'
      },
      getSite () {
        let defaultSite = remote.getGlobal('defaultSite')
        let allSites = remote.getGlobal('allSites') || []
        if (defaultSite && allSites.length) {
          let site = allSites.find(el => el.guid === defaultSite)
          return site.name
        }
        if (defaultSite && !allSites.length) return defaultSite
        else return 'RFCx Lab'
      },
      toggleDropDown () {
        this.shouldShowDropDown = !this.shouldShowDropDown
      },
      logOut () {
        console.log('Log out')
        this.$electron.ipcRenderer.send('logOut')
      },
      hideAlert () {
        this.shouldShowAlert = false
      }
    }
  }
</script>

<style>

  .dropdown-nav {
    vertical-align: middle !important;
    align-items: center !important;
    cursor: pointer;
  }

  .dropdown-menu-navigation {
    top: 76% !important;
  }

</style>
