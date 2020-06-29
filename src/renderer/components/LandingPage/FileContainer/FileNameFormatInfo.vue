<template>
  <div class="preparing-file-settings__wrapper">
    <div class="preparing-file-settings__name-format-wrapper">
      <span class="preparing-file-settings__name-format-title">Filename format</span>
      <span class="preparing-file-settings__name-format-description">xxxx</span>
    </div>
    <div class="preparing-file-settings__actions-wrapper">
      <button type="button" class="button is-rounded cancel">Clear all</button>
      <button type="button" class="button is-rounded is-primary" @click.prevent="queueToUpload()" :disabled="readyToUploadFiles.length < 1">Start upload ({{readyToUploadFiles.length}})</button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    preparingFiles: Array
  },
  computed: {
    readyToUploadFiles () {
      console.log(this.preparingFiles.length)
      return this.preparingFiles.filter(file => file.isPreparing)
    }
  },
  methods: {
    queueToUpload () {
      this.preparingFiles.forEach(file => {
        File.update({ where: file.id,
          data: { state: 'waiting', stateMessage: '' }
        })
      })
    }
  }
}
</script>

<style lang="scss">
  .preparing-file-settings {
    &__wrapper {
      padding: $default-padding-margin;
      display: flex;
      justify-content: space-between;
      align-self: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    &__name-format-title {
      font-weight: $title-font-weight;
      display: block;
    }
    &__name-format-description {
      color: $body-text-color-dark;
      display: block;
    }
  }
</style>
