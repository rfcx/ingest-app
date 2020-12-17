<template>
  <div class="wrapper columns">
    <div class="column info-content">
      <h1 class="title">RFCx Uploader</h1>
      <p class="subtitle">Upload recordings directly into Arbimon from your AudioMoth and other devices.</p>
      <button type="button" class="button is-rounded is-primary is-large" @click.prevent="redirectToAuthWebPage()">Sign In to RFCx</button>
      <p class="caption">We'll take you to your web browser to sign in, and bring you back here once you have set up</p>
    </div>
    <div class="column info-image">
      <img src="@/assets/rfcx-uploader-logo.png">
    </div>
  </div>
</template>

<script>
import authService from '../../main/services/auth-service'
export default {
  methods: {
    redirectToAuthWebPage () {
      let url = authService.getAuthenticationURL()
      this.$electron.shell.openExternal(url)
    }
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  margin: 0 auto;
}
.column {
  margin: auto 0;
  padding: 3rem;
}
.info-content .button {
  margin-bottom: 0.75rem;
}
.info-image {
  text-align: center;
  img {
    max-height: 300px;
  }
}
</style>