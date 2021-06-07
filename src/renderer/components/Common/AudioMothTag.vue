<template>
  <tag-with-icon v-if="show">
    <img class="tag__icon" slot="icon" src="@/assets/ic-audiomoth-white.png" v-if="isSelected"/>
    <img class="tag__icon" slot="icon" src="@/assets/ic-audiomoth-gray.png" v-else>
    <span class="tag__text is-size-7" slot="text" :class="{'selected': isSelected}">AudioMoth</span>
  </tag-with-icon>
</template>

<script>
import TagWithIcon from './Tag/TagWithIcon.vue'
export default {
  components: { TagWithIcon },
  props: {
    show: true,
    isSelected: false
  }
}
</script>

<style lang="scss" scoped>
  .tag {
    &__text {
      color: $secondary-text-color;
    }
    .selected {
      color: $body-text-color;
    }
  }
</style>

