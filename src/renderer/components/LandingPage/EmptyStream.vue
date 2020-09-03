<template>
    <div class="container empty has-text-centered">
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
    }
  }
  .container.empty {
    margin: $default-padding-margin auto;
    padding: $default-padding-margin;
    max-width: 300px;
    transform: translateY(50%);
  }
</style>
