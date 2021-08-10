<template>
  <tag-with-icon>
    <fa-icon :icon="icons.lock" class="tag__icon" slot="icon" aria-hidden="true"></fa-icon>
    <span class="tag__text is-size-7" slot="text">Read Only</span>
  </tag-with-icon>
</template>

<script>
import TagWithIcon from './TagWithIcon'
import { faLock } from '@fortawesome/free-solid-svg-icons'
export default {
  components: { TagWithIcon },
  computed: {
    icons: () => ({
      lock: faLock
    })
  }
}
</script>

<style lang="scss" scoped>
.tag {
    &__icon {
      vertical-align: top;
      font-size: 14px;
    }
  }
</style>
