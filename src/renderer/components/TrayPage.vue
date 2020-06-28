<template>
  <div>
    <aside class="column menu tray-menu" :class="{ 'dark-tray': isDark }">
      <div class="tray-container">
        <div class="menu-container side-menu-title">
          <div class="menu-label">Streams</div>
          <!-- <a href="#" @click="toggleUploadingProcess()"><img :src="getUploadingProcessIcon(this.isUploadingProcessEnabled)"></a> -->
        </div>
        <ul class="menu-list">
          <li v-for="stream in streams" :key="stream.id">
            <div class="menu-item" v-on:click="selectItem(stream)">
              <div class="menu-container" :class="{ 'container-failed': stream.isError }">
                <div class="stream-title">{{ stream.name }}</div>
                <img :src="getStateImgUrl(stream.state)">
              </div>
              <div class="state-progress" v-if="shouldShowProgress(stream)">
                <progress class="progress is-primary" :class="{ 'is-warning': checkWarningLoad(stream), 'is-success': isFilesHidden(stream), 'is-danger': stream.isError }" :value="getProgress(stream)" max="100"></progress>
                <div class="menu-container" :class="{ 'right': checkWarningLoad(stream) || isFilesHidden(stream) || stream.isError }">
                  <span class="menu-container-left">{{ checkWarningLoad(stream) || isFilesHidden(stream) || stream.isError ? '' : stream.state }}</span>
                  <span class="menu-container-right"> {{ getStateStatus(stream) }} </span>
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
  import fileState from '../../../utils/fileState'
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
        if (fileState.isPreparing(state)) return ''
        const s = fileState.isError(state) ? 'failed' : state
        return require(`../assets/ic-state-${s}.svg`)
      },
      selectItem (stream) {
        this.$store.dispatch('setSelectedStreamId', stream.id)
        this.openApp()
      },
      shouldShowProgress (stream) {
        return stream.isCompleted && !stream.isError
      },
      checkWarningLoad (stream) {
        let countFailed = 0
        let countComplited = 0
        let countDisabled = 0
        stream.files.forEach((file) => {
          if (file.disabled === true) {
            countDisabled++
          } else if (fileState.isError(file.state)) {
            countFailed++
          } else if (fileState.isCompleted(file.state)) {
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
          if (file.disabled === true || fileState.isCompleted(file.state)) {
            count++
          }
        })
        if (count === stream.files.length) return true
        else return false
      },
      getStatePriority (stream) {
        const state = stream.state
        switch (state) {
          case 'preparing': return 0
          case 'waiting': return 1
          case 'uploading': return 2
          case 'ingesting': return 3
          case 'completed': return 6
          default:
            if (state.includes('errors')) {
              return 4
            } else {
              return 5
            }
        }
      },
      getProgress (stream) {
        if (stream.isCompleted) return 100
        else if (stream.isInPreparingState || stream.isError) return 0
        else if (this.checkWarningLoad(stream)) return 100
        else if (this.isFilesHidden(stream)) return 100
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        const uploadedFiles = stream.files.filter(file => { return file.state === 'ingesting' || file.state === 'completed' })
        const completedPercentage = completedFiles.length / (stream.files.length * 2) * 100
        const uploadedPercentage = uploadedFiles.length / (stream.files.length * 2) * 100
        return completedPercentage + uploadedPercentage
      },
      getStateStatus (stream) {
        const state = stream.state
        if (stream.isDuplicated) {
          const duplicatedFiles = stream.files.filter(file => { return file.state === 'duplicated' })
          return `0/${duplicatedFiles.length} ingested | ${duplicatedFiles.length} ${duplicatedFiles.length > 1 ? 'errors' : 'error'}`
        } else if (fileState.isError(state)) {
          const failedFiles = stream.files.filter(file => { return file.isError })
          return `0/${failedFiles.length} ingested | ${failedFiles.length} ${failedFiles.length > 1 ? 'errors' : 'error'}`
        } else if (fileState.isCompleted(state)) {
          const successedFiles = stream.files.filter(file => { return file.state === 'completed' })
          return `${successedFiles.length}/${successedFiles.length} ingested | 0 errors`
        } else if (fileState.isPreparing(state)) return stream.files.length + (stream.files.length > 1 ? '+ files' : ' file')
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        const errorFiles = stream.files.filter(file => { return file.isError })
        if (errorFiles.length < 1) return `${completedFiles.length}/${stream.files.length} ingested`
        if (this.isFilesHidden(stream)) {
          let count = 0
          stream.files.forEach(file => {
            if (file.isCompleted) {
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

  .is-danger {
    background-color: #f14668 !important;
    border-color: transparent;
  }

  .menu-container-left,
  .menu-container-right {
    font-family: Avenir;
    font-size: 11px;
    font-weight: 500;
    font-stretch: normal;
    font-style: normal;
    line-height: normal;
    letter-spacing: normal;
    text-align: right;
    color: #f1f1f1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .menu-container-left {
    width: 35%;
    text-align: left;
  }

  .menu-container-right {
    width: 64%;
    text-align: right;
  }

  .dark-tray {
    background-color: #232436 !important;
    color: #fff !important;
    .menu {
      background-color: #232436 !important;
      color: #fff !important;
    }
    .stream-title {
      color: white;
    }
    .menu-item:hover {
     background-color: #2e3145 !important;
    }
  }

</style>
