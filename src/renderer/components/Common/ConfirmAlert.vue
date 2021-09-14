<template>
  <div class="modal alert is-active">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head" v-if="title">
        <p class="modal-card-title">{{ title }}</p>
      </header>
      <section class="modal-card-body" :class="{'modal-card-body-with-title': title}" v-if="content">
        <img v-if="image" class="logo" :src="require(`../../assets/${image}`)">
        {{ content }}
      </section>
      <section class="modal-card-body" :class="{'modal-card-body-with-title': title}" v-else-if="contentHTML">
        <div class="modal-content-text" v-html="contentHTML"></div>
      </section>
      <footer class="modal-card-foot">
        <button class="button is-rounded" @click="cancelButtonPressed()">{{ cancelButtonText }}</button>
        <button v-if="confirmButtonText" class="button is-rounded is-primary" :class="{ 'is-loading': isProcessing, 'is-danger': isDanger }" @click.prevent="confirmButtonPressed()">{{ confirmButtonText }}</button>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    content: String,
    contentHTML: String,
    image: String,
    confirmButtonText: String,
    cancelButtonText: {
      type: String,
      default: 'Cancel'
    },
    isProcessing: false,
    isDanger: true
  },
  methods: {
    cancelButtonPressed () {
      this.$emit('onCancelPressed')
    },
    confirmButtonPressed () {
      this.$emit('onConfirmPressed')
    }
  }
}
</script>

<style lang="scss" scoped>

  .logo {
    vertical-align: middle;
    width: 30px;
    margin-right: 10px;
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
  }

  .modal-card-body-with-title {
    border-top-left-radius: 0px !important;
    border-top-right-radius: 0px !important;
  }

  .modal-card-body {
    white-space: normal;
    color: $body-text-color !important;
  }

  .modal-content-text strong {
    color: $body-text-color !important;
  }

</style>
