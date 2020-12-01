<template>
  <div class="wrapper">
    <h1>Auth</h1>
    <button type="button" class="button is-rounded is-primary" @click.prevent="redirectToAuthWebPage()">Sign In with RFCx</button>
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