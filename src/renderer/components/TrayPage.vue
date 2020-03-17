<template>
  <div>
    <aside class="column menu tray-menu" :class="{ 'dark-tray': isDark }">
      <div class="tray-container">
        <div class="menu-container side-menu-title side-menu-title-tray">
          <p class="menu-label"> {{ menuTitle }} </p>
          <a href="#" @click="toggleUploadingProcess()"><img :src="getUploadingProcessIcon(this.isUploadingProcessEnabled)"></a>
        </div>
        <ul class="tray-menu-list menu-list">
          <li v-for="stream in streams" :key="stream.id">
            <div class="menu-item" v-on:click="selectItem(stream)">
              <div class="menu-container" :class="{ 'container-failed': getState(stream) === 'failed'  || getState(stream) === 'duplicated'}">
                <span class="stream-title">{{ stream.name }}</span>
                <img :src="getStateImgUrl(getState(stream))">
              </div>
              <div class="state-progress" v-if="shouldShowProgress(stream)">
                <progress class="progress is-primary" :class="{ 'is-warning': checkWarningLoad(stream), 'is-success': isFilesHidden(stream), 'is-danger': getState(stream) === 'duplicated' || getState(stream) === 'failed' }" :value="getProgress(stream)" max="100"></progress>
                <div class="menu-container" :class="{ 'right': checkWarningLoad(stream) || isFilesHidden(stream) || getState(stream) === 'failed' || getState(stream) === 'duplicated' }">
                  <span class="is-size-7 menu-container-left">{{ checkWarningLoad(stream) || isFilesHidden(stream) || getState(stream) === 'failed' || getState(stream) === 'duplicated' ? '' : getState(stream) }}</span>
                  <span class="is-size-7 menu-container-right"> {{ getStateStatus(stream) }} </span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </aside>
    <footer class="card-footer" :class="{ 'dark-tray': isDark }">
    <a href="#" class="card-footer-item" @click="openApp()">Open Application</a>
  </footer>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import Stream from '../store/models/Stream'
  import settings from 'electron-settings'

  export default {
    data () {
      return {
        menuTitle: 'Uploading Streams',
        isDark: null,
        darkThemeForm: settings.watch('settings.darkMode', (newValue, oldValue) => {
          this.isDark = newValue
          console.log('isDarkTheme', this.isDark)
        })
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
        return true
        // this.getState(stream) !== 'completed' && this.getState(stream) !== 'failed' && this.getState(stream) !== 'duplicated'
      },
      getState (stream) {
        if (stream.files && !stream.files.length) {
          return 'waiting'
        }
        const hasFiles = stream.files && stream.files.length
        const total = stream.files.length
        const completedFiles = stream.files.filter(file => file.state === 'completed').length
        const waitingFiles = stream.files.filter(file => file.state === 'waiting').length
        const failedFiles = stream.files.filter(file => file.state === 'failed').length
        const duplicatedFiles = stream.files.filter(file => file.state === 'duplicated').length
        const ingestingFiles = stream.files.filter(file => file.state === 'ingesting').length
        const isCompleted = hasFiles && total === completedFiles
        const isWaiting = hasFiles && total === waitingFiles
        const isFailed = hasFiles && failedFiles > 0 && total === (failedFiles + duplicatedFiles)
        const isDuplicated = hasFiles && total === duplicatedFiles
        const isIngesting = hasFiles && total === ingestingFiles
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
        let countDisabled = 0
        stream.files.forEach((file) => {
          if (file.disabled === true) {
            countDisabled++
          } else if (file.state === 'failed' || file.state === 'duplicated') {
            countFailed++
          } else if (file.state === 'completed') {
            countComplited++
          }
        })
        if (countFailed !== stream.files.length && countComplited !== stream.files.length && (countFailed + countComplited + countDisabled) === stream.files.length &&
          (countDisabled + countComplited) !== stream.files.length && (countDisabled + countFailed + countComplited) === stream.files.length) return true
        else return false
      },
      isFilesHidden (stream) {
        let count = 0
        stream.files.forEach(file => {
          if (file.disabled === true || file.state === 'completed') {
            count++
          }
        })
        if (count === stream.files.length) return true
        else return false
      },
      getStatePriority (stream) {
        const state = this.getState(stream)
        switch (state) {
          case 'waiting': return 0
          case 'uploading': return 1
          case 'ingesting': return 2
          case 'failed': return 3
          case 'duplicated': return 4
          case 'completed': return 5
        }
      },
      getProgress (stream) {
        const state = this.getState(stream)
        if (state === 'completed') return 100
        else if (state === 'waiting' || state === 'failed' || state === 'duplicated') return 0
        else if (this.checkWarningLoad(stream)) return 100
        else if (this.isFilesHidden(stream)) return 100
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        const uploadedFiles = stream.files.filter(file => { return file.state === 'ingesting' || file.state === 'completed' })
        const completedPercentage = completedFiles.length / (stream.files.length * 2) * 100
        const uploadedPercentage = uploadedFiles.length / (stream.files.length * 2) * 100
        return completedPercentage + uploadedPercentage
      },
      getStateStatus (stream) {
        const state = this.getState(stream)
        if (state === 'duplicated') {
          const duplicatedFiles = stream.files.filter(file => { return file.state === 'duplicated' })
          return `0/${duplicatedFiles.length} ingested | ${duplicatedFiles.length} ${duplicatedFiles.length > 1 ? 'errors' : 'error'}`
        } else if (state === 'failed') {
          const failedFiles = stream.files.filter(file => { return file.state === 'failed' })
          return `0/${failedFiles.length} ingested | ${failedFiles.length} ${failedFiles.length > 1 ? 'errors' : 'error'}`
        } else if (state === 'completed') {
          const successedFiles = stream.files.filter(file => { return file.state === 'completed' })
          return `${successedFiles.length}/${successedFiles.length} ingested | 0 errors`
        } else if (state === 'waiting') return stream.files.length + (stream.files.length > 1 ? ' files' : ' file')
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        const errorFiles = stream.files.filter(file => { return file.state === 'failed' || file.state === 'duplicated' })
        if (errorFiles.length < 1) return `${completedFiles.length}/${stream.files.length} ingested`
        if (this.isFilesHidden(stream)) {
          let count = 0
          stream.files.forEach(file => {
            if (file.state === 'completed') {
              count++
            }
          })
          return `${completedFiles.length}/${count} ingested`
        }
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
      this.isDark = settings.get('settings.darkMode')
    }
  }
</script>

<style lang="scss">

  .right {
    text-align: right !important;
    justify-content: flex-end !important;
  }

  .container-failed {
    margin-right: 6px;
  }

  .side-menu-title-tray {
    margin-right: 6.5px;
  }

  .is-danger {
    background-color: #f14668 !important;
    border-color: transparent;
  }

  .menu-container-left {
    width: 29%;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .menu-container-right {
    width: 70%;
    text-align: right;
  }

  .dark-tray {
    background-color: #131525 !important;
    color: #fff !important;
    .menu {
      background-color: #131525 !important;
      color: #fff !important;
    }
    .stream-title {
      color: white;
    }
    .menu-item:hover {
      background-color: #292a3b;
    }
  }

</style>
