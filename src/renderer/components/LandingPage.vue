<template>
  <div id="wrapper">
    <navigation></navigation>
    <section class="main-content columns is-mobile">
      <side-navigation></side-navigation>
      <div class="column  is-desktop">xx</div>
    </section>
  </div>
</template>

<script>
  import SystemInformation from './LandingPage/SystemInformation'
  import Navigation from './Navigation/Navigation'
  import SideNavigation from './SideNavigation/SideNavigation'

  export default {
    name: 'landing-page',
    components: { SystemInformation, Navigation, SideNavigation },
    methods: {
      open (link) {
        this.$electron.shell.openExternal(link)
      }
    }
  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

  body { font-family: 'Source Sans Pro', sans-serif; }

  .navbar {
      padding: 0 0.75rem;
  }

  .user-info-nav {
    text-align: right;
  }

  .user-info-nav .name {
      font-weight: bold;
  }

  .user-info-name {
    padding: 1rem;
  }

  .user-info-image {
    margin: auto;
  }

  #wrapper {
    background-color: #FDFDFD;
    height: 100vh;
    padding: 0;
    width: 100vw;
  }

  .main-content {
    padding: 0 0.75rem;
  }

  .menu {
    background-color: #fff;
  }

  .menu-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .menu-label {
    margin: auto 0 !important;
  }

  .menu-list a {
    border-radius: 0;
  }

  .menu a.is-active {
    border-left: 5px solid #2FB04A;
    background-color: transparent;
    color: #4a4a4a;
    font-weight: bold;
  }

  .menu .menu-item {
    padding: 0.5em 0 0.5em 0.75em;
  }

  .menu div.is-active {
    border-left: 5px solid #2FB04A;
    background-color: transparent;
  }

  .menu div.is-active .stream-title {
    font-weight: bold;
  }

  .progress {
    margin: 0.5rem auto !important;
    height: 0.5rem;
  }

  @media screen and (min-width: 400px) {
    
    .navbar-end {
      justify-content: flex-end;
      margin-left: auto;
    }

    .navbar, .navbar-menu, .navbar-start, .navbar-end {
      align-items: stretch;
      display: flex;
    }

    .navbar-item {
      display: flex;
    }

    /* .columns.is-desktop {
      display: flex;
    } */

  }

</style>
