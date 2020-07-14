<template>
    <div class="container-box empty has-text-centered">
        <img src="~@/assets/ic-file.svg" style="margin-bottom: 0.75em"><br>
        <p>A stream is a group of audio files.</p>
        <span>Use  <img src="~@/assets/ic-add-stream.svg" style="vertical-align: sub"/>  button to create your first stream and start uploading files.</span><br>
    </div>
</template>

<style lang="scss" scoped>

  span {
    width: 100px;
    text-align: center;
  }

  .container-box.empty {
    margin: 16px auto;
    padding: 16px;
    max-width: 300px;
    transform: translateY(50%);
  }
  
</style>
