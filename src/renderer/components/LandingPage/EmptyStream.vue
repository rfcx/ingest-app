<template>
    <div class="centered-block has-text-centered">
        <img src="~@/assets/ic-file.svg" style="margin-bottom: 0.75em"><br>
        <!-- <p>A stream is a group of audio files.</p> -->
        <span>Use  <img src="~@/assets/ic-add-stream.svg" style="vertical-align: sub"/>  button to create your first site and start uploading files.</span><br>
    </div>
</template>

<style lang="scss" scoped>

  span {
    width: 100px;
    text-align: center;
    color: $secondary-text-color;
  }

  .container-box.empty {
    margin: $default-padding-margin auto;
    padding: $default-padding-margin;
    max-width: 300px;
    transform: translateY(50%);
  }
  
</style>
