<template>
  <div class="stream-info">
    <div>
      <div class="stream-info__title-wrapper" v-if="selectedStream">
        <router-link title="Edit site location" to="/edit-stream-location">
          <span class="stream-info__title">{{ selectedStream.name }}</span>
          <span class="stream-info__edit-icon" title="Edit the site">
            <font-awesome-icon :icon="iconPencil"></font-awesome-icon>
          </span>
        </router-link>
      </div>
    </div>
    <div class="stream-info__subtitle">
      <router-link title="Edit site location" to="/edit-stream-location">
        <img src="~@/assets/ic-pin.svg">
        <span v-if="selectedStream" class="stream-info__coordinates">{{ selectedStream.siteGuid || `${selectedStream.latitude}, ${selectedStream.longitude}` }}</span></router-link>
    </div>
  </div>
</template>

<script>
import Stream from '../../store/models/Stream'
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons'

export default {
  data () {
    return {
      iconPencil: faPencilAlt
    }
  },
  computed: {
    selectedStreamId () {
      return this.$store.state.Stream.selectedStreamId
    },
    selectedStream () {
      return Stream.find(this.selectedStreamId)
    }
  }
}
</script>

<style lang="scss" scoped>
  .stream-info {
    padding: 0 $default-padding;
    &__title-wrapper {
      font-weight: $title-font-weight;
      margin-bottom: 6px;
    }
    &__title {
      color: $title-text-color;
    }
    &__edit-icon {
      margin-left: 10px;
      color: #9B9B9B;
      font-size: 14px;
      cursor: pointer;
    }
    &__subtitle {
      font-size: $default-subtitle-font-size;
      font-stretch: normal;
      font-style: normal;
      line-height: normal;
      letter-spacing: normal;
      color: $secondary-text-color;
      img {
        width: 1em;
        height: 1em;
        padding-right: 0.25em;
      }
    }
    &__coordinates {
      color: $secondary-text-color
    }
  }
</style>
