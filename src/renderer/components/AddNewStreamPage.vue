<template>
  <div id="wrapper-add-new-stream-page">
    <navigation></navigation>
    <div class="container-box is-fullhd">
      <div class="box-title">
        <h1 class="is-size-4 has-text-weight-bold">Create a new stream</h1>
        <span>A stream is a set of non-overlapping audio files at a location. Each audio file must have a timestamp in its filename</span>
      </div>
      <add-new-stream-form></add-new-stream-form>
    </div>
  </div>
</template>

<script>
  import Navigation from './Navigation/Navigation'
  import AddNewStreamForm from './AddNewStreamPage/AddNewStreamForm'

  export default {
    name: 'add-new-stream-page',
    components: { Navigation, AddNewStreamForm },
    created () {
      console.log('addNewStreamForm created')
    }
  }
</script>

<style lang="scss">

  .container-box {
    margin: 16px auto;
    padding: 16px;
    max-width: 500px;
    background-color: white;
  }

  .box-title {
    margin-bottom: 1rem;
  }

  #wrapper-add-new-stream-page {
    background-color: #fff;
    overflow-y: auto;
  }

  .button-link-form {
    color: black;
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
    .control-btn:focus,
    .control-btn:active {
      outline-color: rgb(19, 21, 37) !important;
    }
    .focus .dropdown-toggle {
      border-radius: 5px;
      box-shadow: 0 0 0 2px #243b31;
    }
    .dropdown-link:hover,
    .dropdown-link:focus {
      background: #3b3e53 !important;
      color: white;
      border: none;
      outline: none;
    }
    .over {
      background: #3b3e53 !important;
      color: white;
      border: none;
      outline: none;
    }
    .dropdown-row:focus {
      outline: none;
      text-decoration: none;
      border: none;
    }
    .notification {
      background: #3b3e53 !important;
      color: white;
    }
    .box-title {
      background-color: #131525 !important;
      color: #131525 !important;
    }
    .cancel {
      background-color: #45485d;
      border-color: #45485d;
      color: #fff;
    }
    .cancel:hover {
      border-color: #3b3e53;
      color: #fff;
      background-color: #3b3e53;
    }
    .button-link-form {
      color: white;
    }
    ::-webkit-scrollbar-thumb {
      background-color: #45485d;
    }
    ::-webkit-scrollbar-track {
      background-color: #52566e;
    }
    ::-webkit-scrollbar {
      width: 3px;
    }
    input[type="text"]::-webkit-input-placeholder {
      color: #52566e !important;
      opacity: 1;
    }
    :-ms-input-placeholder {
      color: #52566e;
    }
    ::-moz-placeholder {
      color: #52566e;
    }
    :-moz-placeholder {
      color: #52566e;
    }
  }

</style>
