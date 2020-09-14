<template>
  <div class="modal alert is-active">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head" v-if="useTitle">
        <p class="modal-card-title">{{ title }}</p>
        <button class="delete" aria-label="close" @click="cancelButtonPressed()"></button>
      </header>
      <section class="modal-card-body" v-if="useContent">
        {{ content }}
      </section>
      <footer class="modal-card-foot">
        <button class="button is-rounded" @click="cancelButtonPressed()">{{cancelButtonText}}</button>
        <button class="button is-danger is-rounded" :class="{ 'is-loading': isProcessing }" @click.prevent="confirmButtonPressed()">{{confirmButtonText}}</button>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    content: String,
    confirmButtonText: String,
    cancelButtonText: {
      type: String,
      default: 'Cancel'
    },
    isProcessing: false,
    useTitle: false,
    useContent: false
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
