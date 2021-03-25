<template>
  <div class="stream-info" v-if="selectedStream">
    <div>
      <div class="stream-info__title-wrapper" v-if="selectedStream">
        <router-link title="Edit site location" to="/edit-stream-location">
          <span class="stream-info__title">{{ selectedStream.name }}</span>
          <span class="stream-info__edit-icon" title="Edit the site">
            <fa-icon :icon="iconPencil"></fa-icon>
          </span>
        </router-link>
      </div>
    </div>
    <div class="stream-info__subtitle">
      <router-link title="Edit site location" to="/edit-stream-location">
        <img src="~@/assets/ic-pin.svg">
        <span v-if="selectedStream" class="stream-info__coordinates">{{ getStreamLocation() }}</span></router-link>
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
import { faPencilAlt, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { mapState } from 'vuex'
import ipcRendererSend from '../../services/ipc'

export default {
  data () {
    return {
      iconPencil: faPencilAlt,
      faExternalLinkAlt: faExternalLinkAlt,
      hasClosedNavigateMessage: false,
      selectedStream: null
    }
  },
  watch: {
    selectedStreamId: {
      handler: function (previousStream, newStream) {
        if (previousStream === newStream) return
        this.getCurrentStream()
      }
    }
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
      return this.selectedStream.siteGuid || `${this.selectedStream.latitude.toFixed(6)}, ${this.selectedStream.longitude.toFixed(6)}`
    },
    async getCurrentStream () {
      this.selectedStream = await ipcRendererSend('db.streams.get', `db.streams.get.${Date.now()}`, this.selectedStreamId)
    }
  },
  async created () {
    this.getCurrentStream()
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
        width: 1em;
        height: 1em;
        padding-right: 0.25em;
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
    .fixed-notice {
      bottom: 10px;
      top: auto;
    }
  }
</style>
