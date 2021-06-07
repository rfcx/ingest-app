<template>
  <div class="tag is-dark">
    <slot class="tag__icon" name="icon"></slot>
    <slot class="tag__text is-size-7" name="text"></slot>
  </div>
</template>

<script>
export default {
  props: {}
}
</script>

<style lang="scss" scoped>
  .tag {
    cursor: default;
    margin-left: 4px;
    &__icon {
      width: 10px;
      height: 10px;
      margin-right: 4px;
      vertical-align: top;
    }
    &__text {
      color: $body-text-color;
    }
  }
</style>

