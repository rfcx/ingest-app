<template>
  <div>
    <aside class="column menu tray-menu">
      <div class="tray-container">
        <div class="menu-container side-menu-title">
          <p class="menu-label"> {{ menuTitle }} </p>
        </div>
        <ul class="tray-menu-list menu-list">
          <li v-for="stream in streams" :key="stream.id">
            <div class="menu-item">
              <div class="menu-container">
                <span class="stream-title"> {{ stream.name }} (_{{ stream.id.substring(0, 4) }}) </span>
                <img :src="getStateImgUrl(getState(stream))">
              </div>
              <div class="state-progress" v-if="shouldShowProgress(stream)">
                <progress class="progress is-primary" :value="getProgress(stream)" max="100"></progress>
                <div class="menu-container">
                    <span class="is-size-7">{{ getState(stream) }}</span>
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
        selectedStreamId: state => state.Stream.selectedStreamId
      }),
      selectedStream () {
        return Stream.find(this.selectedStreamId)
      },
      streams () {
        const allStreams = Stream.query().with('files').get()
        const inProgressStreams = allStreams.filter((stream) => {
          return this.getState(stream) === 'uploading' || this.getState(stream) === 'ingesting'
        })
        return inProgressStreams
      }
    },
    methods: {
      getStateImgUrl (state) {
        return require(`../assets/ic-state-${state}.svg`)
      },
      shouldShowProgress (stream) {
        return this.getState(stream) !== 'completed' && this.getState(stream) !== 'failed'
      },
      getState (stream) {
        const isCompleted = stream.files.every(file => { return file.state === 'completed' })
        const isWaiting = stream.files.every(file => { return file.state === 'waiting' })
        const isFailed = stream.files.every(file => { return file.state === 'failed' })
        const isIngesting = stream.files.every(file => { return file.state === 'completed' || file.state === 'ingesting' || file.state === 'failed' })
        if (isCompleted) return 'completed'
        else if (isWaiting) return 'waiting'
        else if (isFailed) return 'failed'
        else if (isIngesting) return 'ingesting'
        return 'uploading'
      },
      getProgress (stream) {
        const state = this.getState(stream)
        if (state === 'completed') return 100
        else if (state === 'waiting' || state === 'failed') return 0
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
      openApp () {
        this.$electron.ipcRenderer.send('openMainWindow')
      }
    },
    created () {
      console.log('Tray page')
    }
  }
</script>
