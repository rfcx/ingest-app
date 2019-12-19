<template>
  <div>
    <aside class="column menu tray-menu">
      <div class="tray-container">
        <div class="menu-container side-menu-title">
          <p class="menu-label"> {{ menuTitle }} </p>
          <a href="#" @click="toggleUploadingProcess()"><img :src="getUploadingProcessIcon(this.isUploadingProcessEnabled)"></a>
        </div>
        <ul class="tray-menu-list menu-list">
          <li v-for="stream in streams" :key="stream.id">
            <div class="menu-item" v-on:click="selectItem(stream)">
              <div class="menu-container">
                <span class="stream-title"> {{ stream.name }} (_{{ stream.id.substring(0, 4) }}) </span>
                <img :src="getStateImgUrl(getState(stream))">
              </div>
              <div class="state-progress" v-if="shouldShowProgress(stream)">
                <progress class="progress is-primary" :class="{ 'is-warning': checkWarningLoad(stream) }" :value="getProgress(stream)" max="100"></progress>
                <div class="menu-container" :class="{ 'right': checkWarningLoad(stream) }">
                    <span v-if="!checkWarningLoad(stream)" class="is-size-7">{{ getState(stream) }}</span>
                    <span class="is-size-7"> {{ getStateStatus(stream) }} </span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </aside>
    <footer class="card-footer">
    <a href="#" class="card-footer-item" @click="openApp()">Open Application</a>
  </footer>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import Stream from '../store/models/Stream'

  export default {
    data () {
      return {
        menuTitle: 'Uploading Streams'
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
        return require(`../assets/ic-uploading-${state}-white.svg`)
      },
      getStateImgUrl (state) {
        return require(`../assets/ic-state-${state}.svg`)
      },
      selectItem (stream) {
        this.$store.dispatch('setSelectedStreamId', stream.id)
        this.openApp()
      },
      shouldShowProgress (stream) {
        return this.getState(stream) !== 'completed' && this.getState(stream) !== 'failed' && this.getState(stream) !== 'duplicated'
      },
      getState (stream) {
        if (stream.files && !stream.files.length) {
          return 'waiting'
        }
        const isCompleted = stream.files && stream.files.length && stream.files.every(file => { return file.state === 'completed' })
        const isWaiting = stream.files && stream.files.length && stream.files.every(file => { return file.state === 'waiting' })
        const isFailed = stream.files && stream.files.length && stream.files.every(file => { return file.state === 'failed' })
        const isDuplicated = stream.files && stream.files.length && stream.files.every(file => { return file.state === 'duplicated' })
        const isIngesting = stream.files && stream.files.length && stream.files.every(file => { return file.state === 'ingesting' })
        if (isCompleted) return 'completed'
        else if (isWaiting) return 'waiting'
        else if (isFailed) return 'failed'
        else if (isDuplicated) return 'duplicated'
        else if (isIngesting) return 'ingesting'
        return 'uploading'
      },
      checkWarningLoad (stream) {
        let countFailed = 0
        let countComplited = 0
        stream.files.forEach((file) => {
          if (file.state === 'failed' || file.state === 'duplicated') {
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
          case 'duplicated': return 5
        }
      },
      getProgress (stream) {
        const state = this.getState(stream)
        if (state === 'completed') return 100
        else if (state === 'waiting' || state === 'failed' || state === 'duplicated') return 0
        else if (this.checkWarningLoad(stream)) return 100
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        const uploadedFiles = stream.files.filter(file => { return file.state === 'ingesting' || file.state === 'completed' })
        const completedPercentage = completedFiles.length / (stream.files.length * 2) * 100
        const uploadedPercentage = uploadedFiles.length / (stream.files.length * 2) * 100
        return completedPercentage + uploadedPercentage
      },
      getStateStatus (stream) {
        const state = this.getState(stream)
        if (state === 'completed' || state === 'failed' || state === 'duplicated') return ''
        else if (state === 'waiting') return stream.files.length + (stream.files.length > 1 ? ' files' : ' file')
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        const errorFiles = stream.files.filter(file => { return file.state === 'failed' || file.state === 'duplicated' })
        if (errorFiles.length < 1) return `${completedFiles.length}/${stream.files.length} ingested`
        return `${completedFiles.length}/${stream.files.length} ingested | ${errorFiles.length} ${errorFiles.length > 1 ? 'errors' : 'error'}`
      },
      openApp () {
        this.$electron.ipcRenderer.send('openMainWindow')
      },
      toggleUploadingProcess () {
        this.$store.dispatch('setUploadingProcess', !this.isUploadingProcessEnabled)
      }
    },
    created () {
      console.log('Tray page')
    }
  }
</script>

<style>

  .right {
    text-align: right !important;
    justify-content: flex-end !important;
  }

</style>
