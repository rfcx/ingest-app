<template>
  <div class="preparing-file-settings__wrapper">
    <div class="preparing-file-settings__name-format-wrapper">
      <span class="preparing-file-settings__name-format-title">Filename format</span>
      <span class="preparing-file-settings__name-format-description">{{ selectedStream.timestampFormat }}</span>
    </div>
    <div class="preparing-file-settings__actions-wrapper">
      <button type="button" class="button is-rounded is-cancel" @click.prevent="confirmToClearAllFiles()">Clear all</button>
      <button type="button" class="button is-rounded is-primary" @click.prevent="queueToUpload()" :disabled="readyToUploadFiles.length < 1">Start upload ({{readyToUploadFiles.length}})</button>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import File from '../../../store/models/File'
import Stream from '../../../store/models/Stream'

export default {
  props: {
    preparingFiles: Array
  },
  computed: {
    ...mapState({
      selectedStreamId: state => state.Stream.selectedStreamId
    }),
    selectedStream () {
      return Stream.find(this.selectedStreamId)
    },
    readyToUploadFiles () {
      return this.preparingFiles.filter(file => file.isPreparing)
    }
  },
  methods: {
    queueToUpload () {
      // if there is an active session id then reuse that, otherwise generate a new one
      const sessionId = this.$store.state.AppSetting.currentUploadingSessionId || '_' + Math.random().toString(36).substr(2, 9)
      this.$store.dispatch('setCurrentUploadingSessionId', sessionId)
      console.log(sessionId)
      this.readyToUploadFiles.forEach(file => {
        File.update({ where: file.id,
          data: { state: 'waiting', stateMessage: '', sessionId: sessionId }
        })
      })
    },
    confirmToClearAllFiles () {
      this.clearAllFiles()
    },
    clearAllFiles () {
      this.preparingFiles.forEach(file => {
        File.delete(file.id)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
  .preparing-file-settings {
    &__wrapper {
      padding: $default-padding-margin;
      display: flex;
      justify-content: space-between;
      align-self: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    &__name-format-title {
      font-weight: $title-font-weight;
      display: block;
    }
    &__name-format-description {
      color: $secondary-text-color;
      display: block;
    }
  }
</style>
