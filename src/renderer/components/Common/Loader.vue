<template>
  <div class="centered-block loader-wrapper has-text-centered">
    <div class="loader is-loading" :class="{'is-active': show}"></div>
  </div>
</template>

<script>
export default {
  props: {
    show: false
  }
}
</script>

<style lang="scss" scoped>
  .loader-wrapper {
    margin: 16px auto;
    padding: $default-padding;
    width: 80px;
  }
  .loader {
    height: 80px;
    width: 80px;
  }
  .is-active {
    opacity: 1;
    z-index: 1;
  }
</style>