<template>
    <div class="container-box empty has-text-centered empty-stream">
        <img src="~@/assets/ic-file.svg" style="margin-bottom: 0.75em"><br>
        <!-- <p>A stream is a group of audio files.</p> -->
        <span class="empty-stream__descr">Use  <img src="~@/assets/ic-add-stream.svg" style="vertical-align: sub"/>  button to create your first site and start uploading files.</span><br>
    </div>
</template>

<style lang="scss" scoped>
  .empty-stream {
    &__descr {
      width: $full-width;
      text-align: center;
    }
  }
  .container-box {
    margin: 16px auto;
    padding: 16px;
    max-width: 500px;
  }
  .container-box.empty {
    margin: $default-padding-margin auto;
    padding: $default-padding-margin;
    max-width: 300px;
    transform: translateY(50%);
  }
</style>
