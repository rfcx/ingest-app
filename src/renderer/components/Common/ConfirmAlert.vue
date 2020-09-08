<template>
  <div class="modal alert is-active">
    <div class="modal-background"></div>
    <div class="modal-card">
      <div class="modal-card-body">
        <p class="modal-card-title">{{ title }}</p>
      </div>
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
    confirmButtonText: String,
    cancelButtonText: {
      type: String,
      default: 'Cancel'
    },
    isProcessing: false
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