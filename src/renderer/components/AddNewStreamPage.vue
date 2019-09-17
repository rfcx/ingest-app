<template>
  <div id="wrapper">
    <navigation></navigation>
    <div class="container-box is-fullhd">
        <div class="box-title">
            <h1 class="is-size-4 has-text-weight-bold">Create a new stream</h1>
            <span>A stream is a set of non-overlapping audio files at a location. Each audio file must have a timestamp in its filename.</span>
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
    components: { Navigation, AddNewStreamForm }
  }
</script>

<style>

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

#wrapper {
    background-color: #fff;
  }

</style>