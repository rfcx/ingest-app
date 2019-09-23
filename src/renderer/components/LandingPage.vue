<template>
  <div id="wrapper" class="has-fixed-sidebar">
    <navigation></navigation>
    <section class="main-content columns is-mobile">
      <side-navigation></side-navigation>
      <div class="column content is-desktop">
        <empty-folder></empty-folder>
      </div>
    </section>
  </div>
</template>

<script>
  import Navigation from './Navigation/Navigation'
  import SideNavigation from './SideNavigation/SideNavigation'
  import EmptyFolder from './LandingPage/EmptyFolder'
  import EmptyStream from './LandingPage/EmptyStream'
  import db from '../../../utils/db'
  import { mapState } from 'vuex'

  export default {
    name: 'landing-page',
    components: { Navigation, SideNavigation, EmptyFolder, EmptyStream },
    computed: {
      ...mapState({
        selectedStream: state => state.Stream.selectedStream
      })
    },
    mounted: () => {
      console.log('mounted')
      const streams = db.getStreams()
      console.log(streams)
      if (streams == null) {
        console.log('no stream')
        db.setDefault()
      }
    }
  }
</script>

<style lang="scss">

  html {
    overflow: hidden;
  }

  html.has-navbar-fixed-top, body.has-navbar-fixed-top {
    padding-top: $navbar-height;
  }

  .navbar {
      padding: 0 $default-padding-margin;
  }

  .navbar-brand span {
    font-weight: $title-font-weight;
  }

  .user-info-nav {
    text-align: right;
  }

  .user-info-nav .name {
      font-weight: $title-font-weight;
  }

  .user-info-name {
    padding: 1rem;
  }

  .user-info-image {
    margin: auto;
  }

  #wrapper {
    background-color: #fdfdfd;
    padding: 0;
    position: absolute;
    top: $navbar-height;
    bottom: 0;
    left: 0;
    right: 0;
  }

  #wrapper.has-fixed-sidebar {
    overflow: hidden;
    position: inherit;
  }

  #wrapper {
    overflow: auto;
    overflow-y: auto;
  }

  #wrapper.has-fixed-sidebar {
    overflow: hidden;
  }

  .main-content {
    padding: 0 $default-padding-margin;
  }

  .column {
    overflow-y: auto;
  }

  .side-menu {
    flex: none;
    width: 250px !important;
    padding: $default-padding-margin 0;
    margin-right: $default-padding-margin;
    top: $navbar-height;
    bottom: 0;
    position: absolute;
  }

  .content {
    position: absolute;
    top: $navbar-height;
    bottom: 0;
    left: 250px;
    right: 0;
  }

  ::-webkit-scrollbar {
    width: 4px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  ::-webkit-scrollbar-thumb {
    background: $grey-lighter;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: $grey-lighter;
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
    padding: 0 $default-padding-margin;
  }

  .menu .menu-item {
    padding: $default-padding-margin;
  }

  .menu .menu-item:hover {
    background-color: #fafafa;
  }

  .menu div.is-active {
    border-left: 0.35em solid $brand-primary;
    background-color: transparent;
    padding-left: 0.4em;
  }

  .menu div.is-active .stream-title {
    font-weight: $title-font-weight;
  }

  .menu .stream-title {
    color: $title-text-color;
  }

  .progress {
    margin: 0.5rem auto !important;
    height: 0.5rem;
  }

  .field {
    margin-bottom: 1rem !important;
  }

  .button.is-primary {
    font-weight: $title-font-weight;
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
