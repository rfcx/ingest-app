<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Filename Format</p>
      <button class="delete" aria-label="close" @click="closeModal()"></button>
    </header>
    <section class="modal-card-body">
      <!-- Content ... -->
    </section>
    <footer class="modal-card-foot">
      <button class="button" @click="closeModal()">Cancel</button>
      <button class="button is-success" @click="save()">Save changes</button>
    </footer>
  </div>
</template>

<script>
export default {
  methods: {
    save () {
      // TODO: add save logic
      this.closeModal()
    },
    closeModal () {
      console.log('closeModal')
      this.$emit('onClose')
    }
  }
}
</script>