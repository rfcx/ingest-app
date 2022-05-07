<template>
  <div class="stream-info" v-if="selectedStream">
    <div>
      <div class="stream-info__title-wrapper" v-if="selectedStream">
        <span class="stream-info__title">{{ selectedStream.name }}</span>
        <fa-icon class="faRefresh" :icon="iconRefresh" @click.prevent="onClickRefreshStream" v-if="!isFetching"></fa-icon>
        <div class="loader" v-else></div>
      </div>
    </div>
    <div class="stream-info__subtitle">
      <div v-if="selectedStream.projectName" style="display:inline">
        <img src="~@/assets/ic-folder-empty.svg">
        <span class="stream-info__project">{{selectedStream.projectName}}</span>
      </div>
        <img src="~@/assets/ic-pin.svg">
        <span v-if="selectedStream" class="stream-info__coordinates">{{ getStreamLocation() }} {{ streamTimezone }}</span>
    </div>
    <a title="Redirect to Arbimon" class="button is-rounded rounded-button" @click="redirectToArbimon()">
      <fa-icon class="faExternal" :icon="faExternalLinkAlt"></fa-icon>
      <span>Arbimon</span>
    </a>
    <div class="notification fixed-notice default-notice" v-if="showNavigateMessage && !hasClosedNavigateMessage">
      <button class="delete" aria-label="delete" @click="onCloseAlert()"></button>
      <strong>Your audio has completed uploading. Click <a @click="redirectToArbimon()">here</a> to navigate to Arbimon for analysis.</strong>
    </div>
  </div>
</template>

<script>
import api from '../../../../utils/api'
import { faPencilAlt, faExternalLinkAlt, faFolder, faSyncAlt } from '@fortawesome/free-solid-svg-icons'
import { mapState } from 'vuex'

export default {
  data () {
    return {
      iconPencil: faPencilAlt,
      iconRefresh: faSyncAlt,
      faExternalLinkAlt: faExternalLinkAlt,
      faProject: faFolder,
      hasClosedNavigateMessage: false
    }
  },
  props: {
    selectedStream: Object,
    isFetching: Boolean
  },
  computed: {
    ...mapState({
      currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId
    }),
    selectedStreamId () {
      return this.$store.state.AppSetting.selectedStreamId
    },
    showNavigateMessage () {
      return this.selectedStream && this.selectedStream.isCompleted
    },
    streamTimezone () {
      return this.selectedStream.timezone ? `(${this.selectedStream.timezone})` : ''
    }
  },
  methods: {
    onCloseAlert () {
      this.hasClosedNavigateMessage = true
    },
    redirectToArbimon () {
      const isProd = this.selectedStream.env && this.selectedStream.env === 'production'
      this.$electron.shell.openExternal(api.arbimonWebUrl(isProd, this.selectedStreamId))
    },
    getStreamLocation () {
      if (!this.selectedStream) {
        return ''
      }
      return this.selectedStream.siteGuid || `${this.selectedStream.latitude.toFixed(4)}, ${this.selectedStream.longitude.toFixed(4)}`
    },
    onClickRefreshStream () {
      this.$emit('onClickRefreshStream')
    }
  }
}
</script>

<style lang="scss" scoped>
  .stream-info {
    padding: 0 $default-padding;
    position: relative;
    &__title-wrapper {
      font-weight: $title-font-weight;
      margin-bottom: 6px;
      width: 85%;
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
        height: 1em;
        padding-right: 0.25em;
      }
      span {
        margin-right: 0.25em;
      }
    }
    &__coordinates {
      color: $secondary-text-color
    }
    .rounded-button {
      width: 127px;
      position: absolute;
      top: 6px;
      right: $default-padding;
      cursor: pointer;
      span {
        margin-left: 10px;
        font-size: 20px;
        font-size: $default-font-size;
      }
      &__disabled {
        background-color: $button-background-color;
      }
    }
    .faExternal {
      color: $white-color;
      font-size: $default-font-size;
    }

    .faRefresh {
      color: $white-color;
      font-size: 10px;
      margin-left: 4px;
    }

    .loader {
      display: inline-block;
      width: 10px;
      height: 10px;
    }

    .fixed-notice {
      bottom: 10px;
      top: auto;
    }
  }
</style>
