<template>
  <div class="tag" v-if="show">
    <img class="tag__icon" src="@/assets/ic-audiomoth-white.png" v-if="isSelected"/>
    <img class="tag__icon" src="@/assets/ic-audiomoth-gray.png" v-else>
    <span class="tag__text is-size-7" :class="{'selected': isSelected}">AudioMoth</span>
  </div>
</template>

<script>
export default {
  props: {
    show: true,
    isSelected: false
  }
}
</script>

<style lang="scss" scoped>
  .tag {
    margin-left: 4px;
    &__icon {
      width: 10px;
      height: 10px;
      margin-right: 4px;
      vertical-align: top;
    }
    &__text {
      color: $secondary-text-color;
    }
    .selected {
      color: $body-text-color;
    }
  }
</style>

