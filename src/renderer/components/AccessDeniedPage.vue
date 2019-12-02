<template>
  <div id="wrapper-access-denied-page" class="access-denied-page">
    <div class="access-denied-page-label">You don't have required permissions to access this app. Ask admin@rfcx.org for details.</div>
    <div class="access-denied-page-btn">
      <a class="button is-primary" @click="logOut()">Log out</a>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'access-denied-page',
    methods: {
      logOut () {
        console.log('Log out')
        this.$electron.ipcRenderer.send('logOut')
      }
    },
    created () {
      console.log('You do not have required permissions to access this app. Ask admin@rfcx.org for details.')
    }
  }
</script>

<style>

  .access-denied-page {
    margin-top: 150px;
    text-align: center;
  }

  .access-denied-page-label {
    width: 90%;
    text-align: center;
    font-size: 22px;
    font-weight: 300;
    line-height: 4.8rem;
    color: grey;
    margin: 0 auto;
  }

  .access-denied-page-btn {
    margin-top: 20px;
  }

</style>
