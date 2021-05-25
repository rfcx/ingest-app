<template>
  <div class="modal is-active">
    <div class="modal-background" />
    <div class="modal-card">
      <section class="modal-card-body">
        <div class="error-message">{{ content }}</div>
      </section>
      <footer class="modal-card-foot">
        <button class="button is-rounded" @click.prevent="cancelButtonPressed()">{{ buttonText }}</button>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    content: String,
    buttonText: {
      type: String,
      default: 'OK'
    }
  },
  methods: {
    cancelButtonPressed () {
      this.$emit('onCancelPressed')
    }
  }
}
</script>

<style lang="scss" scoped>
  .modal {
    .modal-card {
      border-radius: 8px;
      .error-message {
        color: white;
      }

      .close-modal-btn {
        margin-top: 12px;
        color: white;
      }
    }
  }
</style>