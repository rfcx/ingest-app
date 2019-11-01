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
      <div class="navbar-item" v-if="login">
        <div class="navbar-item user-info-nav">
            <div class="user-info-name"><span><span class="name">Hello, {{name}}!</span><br><span class="site-name">{{ siteName }}</span></span></div>
            <div class="user-info-image"><img src="~@/assets/ic-profile-temp.svg" alt="rfcx" width="30" height="30"></div>
        </div>
         <!-- <div class="navbar-item"> -->
            
        <!-- </div> -->
      </div>
      <div class="navbar-item" v-else>
        <a class="button is-primary">Log in</a>
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
  import { mapState } from 'vuex'
  import File from '../../store/models/File'

  export default {
    data () {
      return {
        name: 'Awesome',
        siteName: 'Osa Conservation',
        login: true,
        shouldShowAlert: false
      }
    },
    computed: {
      ...mapState({
        selectedStreamId: state => state.Stream.selectedStreamId,
        isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess,
        productionEnv: state => state.Settings.productionEnvironment
      }),
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
        this.$store.dispatch('setEnvironment', !this.productionEnv)
      },
      hideAlert () {
        this.shouldShowAlert = false
      }
    }
  }
</script>
