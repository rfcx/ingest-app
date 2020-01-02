<template>
  <div id="wrapper-add-new-stream-page" :class="{ 'dark-page': isDark }">
    <navigation :class="{ 'dark-mode': isDark }"></navigation>
    <div class="container-box is-fullhd" :class="{ 'dark-page': isDark }">
      <div class="box-title">
        <h1 class="is-size-4 has-text-weight-bold">Create a new stream</h1>
        <span>A stream is a set of non-overlapping audio files at a location. Each audio file must have a timestamp in its filename</span>
      </div>
      <add-new-stream-form :class="{ 'dark-page': isDark }"></add-new-stream-form>
    </div>
  </div>
</template>

<script>
  import Navigation from './Navigation/Navigation'
  import AddNewStreamForm from './AddNewStreamPage/AddNewStreamForm'
  import settings from 'electron-settings'

  export default {
    name: 'add-new-stream-page',
    data () {
      return {
        isDark: null,
        darkThemeForm: settings.watch('settings.darkMode', (newValue, oldValue) => {
          this.isDark = newValue
          console.log('isDarkTheme', this.isDark)
        })
      }
    },
    components: { Navigation, AddNewStreamForm },
    created () {
      console.log('addNewStreamForm created')
      this.isDark = settings.get('settings.darkMode')
    }
  }
</script>

<style lang="scss">

  .container-box {
    margin: 16px auto;
    padding: 16px;
    max-width: 500px;
  }

  .container-box.empty {
    margin: 16px auto;
    padding: 16px;
    max-width: 300px;
  }

  .box-title {
    margin-bottom: 1rem;
  }

  #wrapper-add-new-stream-page {
    background-color: #fff;
  }

  .dark-page {
    background-color: #131525 !important;
    color: #fff !important;
    fieldset label {
      color: #fff !important;
    }
    .input, .textarea, .select select {
      color: #fff !important;
      background-color: #292a3b !important;
      border-color: #292a3b !important;
    }
    .is-light {
      background: #35374a !important;
      color: white !important;
    }
    .is-light:hover {
      background: #3b3e53 !important;
      color: white !important;
    }
    .dropdown-toggle {
      border-color: #292a3b;
      background-color: #292a3b;
      color: white;
    }
    .dropdown-list {
      border-color: #292a3b;
      background-color: #292a3b;
      color: white;
    }
    .dropdown-link {
      color: white;
    }
    .dropdown-link:hover {
      background: #3b3e53 !important;
      color: white;
    }
    .notification {
      background: #3b3e53 !important;
      color: white;
    }
    .box-title {
      background-color: #131525 !important;
      color: #131525 !important;
    }
  }

</style>
