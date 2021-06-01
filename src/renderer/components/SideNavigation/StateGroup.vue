<template>
  <div class="wrapper">
    <img class="state-icon" :src="getStateImgUrl(state)" :class="{'state-icon__error': isError(state)}">
    <span class="state-text is-size-7">{{ number.toLocaleString() }}</span>
  </div>
</template>

<script>
import fileState from '../../../../utils/fileState'

export default {
  props: {
    state: {
      type: String,
      default: ''
    },
    number: {
      type: Number,
      default: 0
    }
  },
  methods: {
    getStateImgUrl (state) {
      if (fileState.isPreparing(state)) return ''
      const iconName = fileState.getIconName(state)
      return require(`../../assets/${iconName}`)
    },
    isError (state) {
      return fileState.isError(state)
    }
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    font-size: $default-subtitle-font-size;
    font-stretch: normal;
    font-style: normal;
    line-height: normal;
    letter-spacing: normal;
    color: $body-text-color;
    display: inline-block;
  }
  .state-icon {
    height: 16px;
    margin-right: 0.25em;
    vertical-align: top;
    &__error {
      padding: 2px;
    }
  }
  .state-text {
    margin-right: 0.25em;
  }
</style>