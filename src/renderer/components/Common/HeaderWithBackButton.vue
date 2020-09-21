<template>
  <div class="header__wrapper">
    <font-awesome-icon :icon="icons.back" class="header__back-button" v-if="shouldShowBackButton" @click="onClickBackButton"/>
    <h1 class="header__title">{{title}}</h1>
  </div>
</template>

<script>
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
export default {
  props: {
    title: String,
    shouldShowBackButton: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    icons: () => ({
      back: faArrowLeft
    })
  },
  methods: {
    onClickBackButton () {
      this.$router.go(-1)
    }
  }
}
</script>

<style lang="scss" scoped>

  .header {
    &__wrapper {
      margin-bottom: 0.75em;
    }
    &__title {
      display: inline;
    }
    &__back-button {
      cursor: pointer;
      margin-right: $default-padding-margin;
    }
  }
  
</style>
