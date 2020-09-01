<template>
  <div class="stream-info-container">
    <div class="title-container">
      <div class="title-container-text" v-if="selectedStream">
        <router-link title="Edit site location" to="/edit-stream-location">
          <span class="stream-name">{{ selectedStream.name }}</span>
          <span class="title-container-edit" title="Edit the site">
            <font-awesome-icon :icon="iconPencil"></font-awesome-icon>
          </span>
        </router-link>
      </div>
    </div>
    <div class="subtitle-container">
      <router-link title="Edit site location" to="/edit-stream-location">
        <img src="~@/assets/ic-pin.svg">
        <span v-if="selectedStream" class="file-list-span">{{ selectedStream.siteGuid || `${selectedStream.latitude}, ${selectedStream.longitude}` }}</span></router-link>
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

  .title-container-text {
    font-weight: $title-font-weight;
    margin-bottom: 6px !important;
    max-width: 80%;
  }

  .subtitle-container {
    font-size: $default-subtitle-font-size;
    font-stretch: normal;
    font-style: normal;
    line-height: normal;
    letter-spacing: normal;
    color: $secondary-text-color !important;
  }

  .title-container-text .stream-name {
    color: $title-text-color;
  }

  .file-list-span {
    color: $secondary-text-color !important;
  }

  .title-container-edit {
    margin-left: 10px !important;
    color: #9B9B9B !important;
    font-size: 14px;
    cursor: pointer;
  }

</style>
