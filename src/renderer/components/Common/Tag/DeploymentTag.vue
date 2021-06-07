<template>
  <tag-with-icon :class="{'error': !isChecking && !isDetected}">
    <fa-icon :icon="icons.loading" class="tag__icon" slot="icon" aria-hidden="true" spin v-if="isChecking"></fa-icon>
    <fa-icon :icon="icons.detected" class="tag__icon detected" slot="icon" aria-hidden="true" v-else-if="isDetected"/>
    <fa-icon :icon="icons.error" class="tag__icon" slot="icon" aria-hidden="true" v-else/>
    <span class="tag__text is-size-7" slot="text" :class="{'detected': isDetected}">{{ title }}</span>
  </tag-with-icon>
</template>

<script>
import TagWithIcon from './TagWithIcon'
import { faCheckCircle, faExclamationCircle, faCircleNotch } from '@fortawesome/free-solid-svg-icons'
export default {
  props: {
    isDetected: {
      type: Boolean,
      default: false
    },
    isChecking: {
      type: Boolean,
      default: false
    }
  },
  components: { TagWithIcon },
  computed: {
    icons: () => {
      return {
        detected: faCheckCircle,
        error: faExclamationCircle,
        loading: faCircleNotch
      }
    },
    title () {
      if (this.isChecking) return 'Getting deployment information'
      if (this.isDetected) return 'Deployment detected'
      return 'Deployment not found'
    }
  }
}
</script>

<style lang="scss" scoped>
  .tag {
    &__text,
    &__icon {
      color: $secondary-text-color;
    }
    .detected {
      color: $body-text-color;
    }
  }
  .error {
    cursor: help;
  }
</style>
