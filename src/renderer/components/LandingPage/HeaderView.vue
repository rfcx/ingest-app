<template>
  <div class="stream-info">
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
        <span v-if="selectedStream" class="stream-info__coordinates">{{ selectedStream.siteGuid || selectedStream.location }}</span></router-link>
    </div>
    <a title="Redirect to Arbimon" class="button is-rounded rounded-button" :class="{ 'rounded-button__disabled': !isStreamCompleted || !files.length}" @click="redirectToArbimon()">
      <fa-icon class="faExternal" :icon="faExternalLinkAlt"></fa-icon>
      <span>Arbimon</span>
    </a>
    <div class="notification fixed-notice default-notice" v-if="showNavigateMessage">
      <button class="delete" aria-label="delete" @click="onCloseAlert()"></button>
      <strong>Your audio has completed uploading. Click <a @click="redirectToArbimon()">here</a> to navigate to Arbimon for analysis.</strong>
    </div>
  </div>
</template>

<script>
import Stream from '../../store/models/Stream'
import File from '../../store/models/File'
import api from '../../../../utils/api'
import { faPencilAlt, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { mapState } from 'vuex'

export default {
  data () {
    return {
      iconPencil: faPencilAlt,
      faExternalLinkAlt: faExternalLinkAlt,
      showNavigateMessage: false
    }
  },
  computed: {
    ...mapState({
      currentUploadingSessionId: state => state.AppSetting.currentUploadingSessionId
    }),
    filesInUploadingSession () {
      if (!this.currentUploadingSessionId) return []
      return File.query().where('sessionId', this.currentUploadingSessionId).get()
    },
    selectedStreamId () {
      return this.$store.state.Stream.selectedStreamId
    },
    selectedStream () {
      return Stream.find(this.selectedStreamId)
    },
    files () {
      return File.query().where('streamId', this.selectedStreamId).orderBy('name').get()
    },
    isStreamCompleted () {
      return this.completedFiles.length > 0
    },
    completedFiles () {
      return this.files.filter(file => file.isInCompletedGroup && !file.isError)
    },
    allFilesInUploadingSessionCompleted () {
      const allFilesInSiteInUploadingSession = this.files.filter(file => file.sessionId === this.currentUploadingSessionId)
      const completedFilesInSiteInUploadingSession = this.files.filter(file => file.isInCompletedGroup && file.sessionId === this.currentUploadingSessionId)
      if (completedFilesInSiteInUploadingSession.length === 0 || allFilesInSiteInUploadingSession === 0) return false
      return completedFilesInSiteInUploadingSession.length === allFilesInSiteInUploadingSession.length
    }
  },
  methods: {
    onCloseAlert () {
      this.showNavigateMessage = false
    },
    redirectToArbimon () {
      const isProd = this.selectedStream.env && this.selectedStream.env === 'production'
      this.$electron.shell.openExternal(api.arbimonWebUrl(isProd, this.selectedStreamId))
    }
  },
  watch: {
    filesInUploadingSession () {
      if (this.allFilesInUploadingSessionCompleted) {
        this.showNavigateMessage = true
      }
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
