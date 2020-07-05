<template>
  <fieldset class="fieldset__wrapper">
  <!-- <div class="notification" v-show="error">
    <button class="delete" @click="onCloseAlert()"></button>
    {{ error }}
  </div> -->
  <div class="field field-stream-name">
    <label for="name" class="label">Stream name</label>
    <div class="control">
      <input v-model="name" class="input" type="text" placeholder="Jaguar 1">
    </div>
  </div>
  <div class="field field-location">
    <label for="name" class="label">Locations</label>
    <div class="control">
      <input v-model="location" class="input" type="text" placeholder="Latitude, Longitude">
    </div>
  </div>
  <div class="field is-grouped">
    <p class="control control-btn">
      <router-link class="control-btn" to="/"><button type="button" class="button is-rounded cancel">Cancel</button></router-link>
    </p>
    <p class="control control-btn">
      <button type="button" class="button is-rounded is-primary" :class="{ 'is-loading': isLoading }" :disabled="!hasPassedValidation" @click.prevent="createStream">Create</button>
    </p>
  </div>
</fieldset>
</template>

<script>
export default {
  data () {
    return {
      name: '',
      location: '',
      isLoading: false,
      hasPassValidation: false
    }
  },
  computed: {
    hasPassedValidation () {
      return this.name && this.location
    }
  },
  methods: {
    createStream () {
      // TODO: implement this
    }
  }
}
</script>

<style lang="scss" scoped>
  .fieldset {
   &__wrapper {
      margin: 32px auto;
      padding: 16px;
      max-width: 500px;
    }
  }
</style>
