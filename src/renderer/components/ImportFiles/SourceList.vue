<template>
  <table>
    <tr class="source-type__row">
      <span class="source-type__title">External drives</span>
      <!-- <button class="button is-small is-rounded" :class="{'is-loading': isLoading}" :disabled="isLoading" @click="getExternalDriveList">Rescan</button> -->
    </tr>
    <template v-if="!drives || drives.length === 0">
      <tr>
        <img class="row__icon" src="@/assets/ic-sd-card-gray.svg"/>
        <span class="row__source-title">No SD Card detected</span>
      </tr>
    </template>
    <template v-else>
    <tr v-for="drive in drives" :key="drive.id" @click="onDriveSelected(drive)" :class="{'selected': isSelected('external', drive) }">
      <img class="row__icon" src="@/assets/ic-sd-card-white.svg" v-if="isSelected('external', drive) || defaultState"/>
      <img class="row__icon" src="@/assets/ic-sd-card-gray.svg" v-else/>
      <span class="row__source-title" :class="{'default': defaultState}">{{ drive.label }}</span>
      <AudioMothTag :show="drive.deviceId" :isSelected="(isSelected('external', drive) || defaultState)"/>
    </tr>
    </template>
    <template>
    <tr class="source-type__row">
      <span class="source-type__title">Other Folder</span>
    </tr>
    <tr @click="onClickChangeFolder" :class="{'selected':  isSelected('folder') }">
      <input type="file" ref="file" webkitdirectory directory @change="handleFileChange" style="display:none"/>
      <img class="row__icon" src="@/assets/ic-folder-empty-white.svg" v-if="isSelected('folder') || defaultState"/>
      <img class="row__icon" src="@/assets/ic-folder-empty.svg" v-else/>
      <span class="row__source-title" :class="{'default': defaultState}" v-if="selectedFolder.path">{{ selectedFolder.path }}</span>
      <span class="row__folder-button" :class="{'default': defaultState}" v-else>Choose other folder...</span>
      <AudioMothTag :show="selectedFolder.deviceId" :isSelected="(isSelected('folder') || defaultState)"/>
      </div> -->
    </tr>
    </template>
  </table>
</template>

<script>
import DriveList from '../../../../utils/DriveListHelper'
import FileHelper from '../../../../utils/fileHelper'
import FileInfo from '../../services/FileInfo'
import AudioMothTag from '../Common/AudioMothTag'
export default {
  data: () => ({
    driveFetchingInterval: null,
    drives: null,
    selectedSource: {},
    selectedFolder: {},
    defaultState: true,
    isLoading: false // user hasn't selected any options before
  }),
  components: { AudioMothTag },
  methods: {
    async getExternalDriveList () {
      console.log('driveFetchingInterval')
      this.isLoading = true
      DriveList.getExternalDriveList().then(drives => {
        this.isLoading = false
        if (drives.length === 0) return
        this.drives = drives.map(drive => {
          const deviceId = this.getDeviceId(drive.path)
          return {...drive, deviceId}
        })
        console.log('view =>', this.drives)
      })
    },
    getDeviceId (path) {
      const stuffInDirectory = FileHelper
        .getFilesFromDirectoryPath(path)
        .map((name) => {
          return { name: name, path: path + '/' + name }
        })
      // read file header info
      const firstWavFile = stuffInDirectory.find(file => {
        return FileHelper.getExtension(file.path) === 'wav' // read only wav file header info
      })
      if (!firstWavFile) return undefined
      const deviceId = new FileInfo(firstWavFile.path).deviceId
      return deviceId
    },
    onDriveSelected (drive) {
      this.selectedSource = drive
    },
    onClickChangeFolder () {
      if (this.selectedFolder.path) {
        console.log('change selected source', this.selectedFolder)
        const path = this.selectedFolder.path
        const deviceId = this.selectedFolder.deviceId
        this.selectedSource = {id: path, label: path, path: path, deviceId: deviceId}
      }
      this.$refs.file.click()
    },
    handleFileChange (event) {
      console.log(event.target.files)
      const path = event.target.files[0].path
      const deviceId = this.getDeviceId(path)
      this.selectedFolder = {path, deviceId}
      this.selectedSource = {id: path, label: path, path: path, deviceId: deviceId}
    },
    isSelected (type, drive = null) {
      switch (type) {
        case 'external': return drive.id === this.selectedSource.id
        case 'folder': return this.selectedSource.path === this.selectedFolder.path
        default: return false
      }
    }
  },
  watch: {
    selectedSource (val, oldVal) {
      if (val === oldVal) return
      if (this.defaultState === true) { // first time
        this.defaultState = false
      }
      this.$emit('sourceSelected', val)
    }
  },
  created () {
    // fetch drive list for the first time
    this.getExternalDriveList()

    // set an interval to fetch drive list every 5 secs
    this.driveFetchingInterval = setInterval(() => {
      this.getExternalDriveList()
    }, 5000)
  },
  beforeDestroy () {
    clearInterval(this.driveFetchingInterval)
  }
}
</script>

<style lang="scss" scoped>
  .row {
    &__icon {
      width: 40px;
      height: 40px;
      vertical-align: middle;
      padding: $default-padding-margin;
    }
  }
  table {
    margin: $default-padding-margin 0px;
    width: 280px;
  }
  tr {
    margin-bottom: $default-padding-margin;
    height: 40px;
    span {
      color: $secondary-text-color;
    }
    &.selected span,
    span.default {
      color: $body-text-color;
    }
    &:hover {
      cursor: pointer;
    }
  }
  .source-type {
      &__row {
        height: 20px;
        margin-bottom: 0;
        display: flex;
        justify-content: space-between;
        align-self: center;
        white-space: nowrap;
      }
      &__title {
        font-size: 12px;
        color: $secondary-text-color;
        font-weight: 700;
      }
    }
</style>
