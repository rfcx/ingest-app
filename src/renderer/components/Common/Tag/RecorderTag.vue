<template>
  <tag-with-icon v-if="show">
    <img class="tag__icon" slot="icon" :src="selectedIcon" v-if="isSelected"/>
    <img class="tag__icon" slot="icon" :src="unselectedIcon" v-else>
    <span class="tag__text is-size-7" slot="text" :class="{'selected': isSelected}">{{ type }}</span>
  </tag-with-icon>
</template>

<script>
import TagWithIcon from './TagWithIcon.vue'
export default {
  components: { TagWithIcon },
  props: {
    show: true,
    isSelected: false,
    type: {
      type: String,
      validator: value => ['Song Meter', 'AudioMoth', 'FRONTIER LABS'].includes(value) ? value : undefined
    }
  },
  computed: {
    selectedIcon () {
      const path = this.type === 'AudioMoth' ? 'ic-audiomoth-white' : this.type === 'Song Meter' ? 'ic-songmeter-light' : 'ic-frontier-labs-white'
      return require(`../../../assets/${path}.png`)
    },
    unselectedIcon () {
      const path = this.type === 'AudioMoth' ? 'ic-audiomoth-gray' : this.type === 'Song Meter' ? 'ic-songmeter-gray' : 'ic-frontier-labs-gray'
      return require(`../../../assets/${path}.png`)
    }
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

