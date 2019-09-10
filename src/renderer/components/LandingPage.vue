<template>
  <div id="wrapper">
    <navigation></navigation>
    <section class="main-content columns is-mobile">
      <side-navigation></side-navigation>
      <div class="column is-desktop">xx</div>
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
    background-color: #fdfdfd;
    height: 100vh;
    padding: 0;
    width: 100vw;
  }

  .main-content {
    padding: 0 0.75rem;
    height: inherit;
  }

  .side-menu {
    flex: none;
    width: 250px !important;
    padding: 0.75em 0;
    margin-right: 0.75em;
  }

  .menu {
    background-color: #fff;
  }

  .menu-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .side-menu-title {
    padding: 0 0.75em;
  }

  .menu .menu-item {
    padding: 0.75em;
  }

  .menu .menu-item:hover {
    background-color: #fafafa;
  }

  .menu div.is-active {
    border-left: 0.35em solid #2FB04A;
    background-color: transparent;
    padding-left: 0.4em;
  }

  .menu div.is-active .stream-title {
    font-weight: 600;
  }

  .menu .stream-title {
    color: #000;
    font-weight: 500;
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

  }

</style>
