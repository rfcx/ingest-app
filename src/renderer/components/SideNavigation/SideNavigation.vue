<template>
    <aside class="column menu side-menu">
        <div class="menu-container side-menu-title">
            <p class="menu-label"> {{ menuTitle }} </p>
            <div class="side-menu-controls-wrapper">
              <a :title="isUploadingProcessEnabled? 'Pause' : 'Continue'" v-if="selectedStream && !hidePause(streams)" href="#" @click="toggleUploadingProcess()" style="padding-right: 0.25rem"><img class="side-menu-controls-btn" :src="getUploadingProcessIcon(this.isUploadingProcessEnabled)"></a>
              <router-link title="Add a stream" to="/add"><img class="side-menu-controls-btn" src="~@/assets/ic-add-btn.svg"></router-link>
            </div>
        </div>
        <ul class="menu-list">
            <li v-for="stream in streams" :key="stream.id">
                <div class="menu-item" v-on:click="selectItem(stream)" :class="{ 'is-active': isActive(stream) }">
                    <div class="menu-container" :class="{ 'menu-container-failed': getState(stream) === 'failed' }">
                        <span class="stream-title"> {{ stream.name }} (_{{ stream.id.substring(0, 4) }}) </span>
                        <img :src="getStateImgUrl(getState(stream))">
                    </div>
                    <div class="state-progress" v-if="shouldShowProgress(stream)">
                        <progress class="progress is-primary" :class="{ 'is-warning': checkWarningLoad(stream) }" :value="getProgress(stream)" max="100"></progress>
                        <div class="menu-container">
                            <span class="is-size-7">{{ getState(stream) }}</span>
                            <span class="is-size-7"> {{ getStateStatus(stream) }} </span>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </aside>
</template>

<script>
  import { mapState } from 'vuex'
  import Stream from '../../store/models/Stream'

  export default {
    data () {
      return {
        menuTitle: 'Streams',
        uploadingStreams: {}
      }
    },
    computed: {
      ...mapState({
        selectedStreamId: state => state.Stream.selectedStreamId,
        isUploadingProcessEnabled: state => state.Stream.enableUploadingProcess
      }),
      selectedStream () {
        return Stream.find(this.selectedStreamId)
      },
      streams () {
        return Stream.query().with('files').get().sort((streamA, streamB) => {
          return this.getStatePriority(streamA) - this.getStatePriority(streamB)
        })
      }
    },
    methods: {
      getUploadingProcessIcon (enabled) {
        const state = enabled ? 'pause' : 'play'
        return require(`../../assets/ic-uploading-${state}-green.svg`)
      },
      getStateImgUrl (state) {
        return require(`../../assets/ic-state-${state}.svg`)
      },
      selectItem (stream) {
        this.$store.dispatch('setSelectedStreamId', stream.id)
      },
      isActive (stream) {
        if (this.selectedStream === null) return false
        return stream.id === this.selectedStream.id
      },
      shouldShowProgress (stream) {
        return this.getState(stream) !== 'completed' && this.getState(stream) !== 'failed'
      },
      sendNotification (status) {
        let notificationCompleted = {
          title: 'Ingest App',
          body: 'Stream uploaded successfully'
        }
        if (status === 'completed') {
          let myNotificationCompleted = new window.Notification(notificationCompleted.title, notificationCompleted)
          myNotificationCompleted.onshow = () => {
            console.log('show notification')
          }
        }
      },
      getState (stream) {
        if (stream.files && !stream.files.length) {
          return 'waiting'
        }
        if (stream.completed === true) {
          return 'completed'
        }
        const isCompleted = stream.files && stream.files.length && stream.files.every(file => { return file.state === 'completed' })
        const isWaiting = stream.files && stream.files.length && stream.files.every(file => { return file.state === 'waiting' })
        const isFailed = stream.files && stream.files.length && stream.files.every(file => { return file.state === 'failed' })
        const isIngesting = stream.files && stream.files.length && stream.files.every(file => { return file.state === 'ingesting' })
        if (isCompleted) {
          if (!!this.uploadingStreams[stream.id] && this.uploadingStreams[stream.id] !== 'completed') {
            this.sendNotification('completed')
          }
          this.uploadingStreams[stream.id] = 'completed'
          stream.completed = true
          return 'completed'
        } else if (isWaiting) {
          this.uploadingStreams[stream.id] = 'waiting'
          stream.completed = false
          return 'waiting'
        } else if (isFailed) {
          this.uploadingStreams[stream.id] = 'failed'
          stream.completed = false
          return 'failed'
        } else if (isIngesting) {
          this.uploadingStreams[stream.id] = 'ingesting'
          stream.completed = false
          return 'ingesting'
        } else {
          this.uploadingStreams[stream.id] = 'uploading'
          stream.completed = false
          return 'uploading'
        }
      },
      hidePause (streams) {
        let count = 0
        streams.forEach(stream => {
          if (this.getState(stream) === 'completed' || this.getState(stream) === 'failed') {
            count++
          } else if (this.getState(stream) === 'uploading' && this.checkWarningLoad(stream)) {
            count++
          }
        })
        if (count === streams.length) return true
      },
      checkWarningLoad (stream) {
        let countFailed = 0
        let countComplited = 0
        stream.files.forEach((file) => {
          if (file.state === 'failed') {
            countFailed++
          } else if (file.state === 'completed') {
            countComplited++
          }
        })
        if (countFailed !== stream.files.length && countComplited !== stream.files.length && (countFailed + countComplited) === stream.files.length) return true
      },
      getStatePriority (stream) {
        const state = this.getState(stream)
        switch (state) {
          case 'uploading': return 0
          case 'ingesting': return 1
          case 'waiting': return 2
          case 'failed': return 3
          case 'completed': return 4
        }
      },
      getProgress (stream) {
        const state = this.getState(stream)
        if (state === 'completed') return 100
        else if (state === 'waiting' || state === 'failed') return 0
        else if (this.checkWarningLoad(stream)) return 100
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        const uploadedFiles = stream.files.filter(file => { return file.state === 'ingesting' || file.state === 'completed' })
        const completedPercentage = completedFiles.length / (stream.files.length * 2) * 100
        const uploadedPercentage = uploadedFiles.length / (stream.files.length * 2) * 100
        return completedPercentage + uploadedPercentage
      },
      getStateStatus (stream) {
        const state = this.getState(stream)
        if (state === 'completed' || state === 'failed') return ''
        else if (state === 'waiting') return stream.files.length + (stream.files.length > 1 ? ' files' : ' file')
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        const errorFiles = stream.files.filter(file => { return file.state === 'failed' })
        if (errorFiles.length < 1) return `${completedFiles.length}/${stream.files.length} ingested`
        return `${completedFiles.length}/${stream.files.length} ingested | ${errorFiles.length} ${errorFiles.length > 1 ? 'errors' : 'error'}`
      },
      toggleUploadingProcess () {
        this.$store.dispatch('setUploadingProcess', !this.isUploadingProcessEnabled)
      }
    }
  }
</script>
