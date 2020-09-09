<template>
    <div class="centered-block has-text-centered">
        <img src="~@/assets/ic-file.svg" style="margin-bottom: 0.75em"><br>
        <!-- <p>A stream is a group of audio files.</p> -->
        <span class="container__descr">Use  <img src="~@/assets/ic-add-stream.svg" style="vertical-align: sub"/>  button to create your first site and start uploading files.</span><br>
    </div>
</template>

<style lang="scss" scoped>
  .container {
    margin: 16px auto;
    padding: $default-padding;
    max-width: $wrapper-width;
    &__descr {
      width: $full-width;
      text-align: center;
      color: $secondary-text-color;
    }
  }
</style>
