<template>
  <nav class="navbar is-fixed-top" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <div class="navbar-item">
      <router-link to="/"><img src="~@/assets/rfcx-logo.png" alt="rfcx"></router-link>
    </div>
    <span class="navbar-item">RFCx Ingestion</span>
  </div>
  <div class="navbar-end">
      <div class="navbar-item" v-if="login">
        <div class="navbar-item user-info-nav">
            <div class="user-info-name"><span><span class="name">Welcome, {{ name }}</span><br><span class="site-name">{{ siteName }}</span></span></div>
            <div class="user-info-image"><img src="~@/assets/temp.png" alt="rfcx" width="30" height="30"></div>
        </div>
         <!-- <div class="navbar-item"> -->
            
        <!-- </div> -->
      </div>
      <div class="navbar-item" v-else>
        <a class="button is-primary">Log in</a>
      </div>
    </div>
  </nav>
</template>

<script>
  export default {
    data () {
      return {
        name: 'Nui',
        siteName: 'Osa Conservation',
        login: true
      }
    }
  }
</script>
