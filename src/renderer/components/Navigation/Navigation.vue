<template>
  <nav class="navbar" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <div class="navbar-item">
      <img src="~@/assets/rfcx-logo.png" alt="rfcx">
    </div>
    <span class="navbar-item"><strong>RFCx Ingestion</strong></span>
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
