<template>
  <table>
    <tr class="source-type__row">
      <span class="source-type__title">AudioMoth SD Card</span>
    </tr>
    <template v-if="!audioMothDrives || audioMothDrives.length === 0">
      <tr>
        <img class="row__icon" src="@/assets/ic-sd-card-gray.svg"/>
        <span class="row__source-title">No AudioMoth SD Card detected</span>
      </tr>
    </template>
    <template v-else>
    <tr v-for="drive in audioMothDrives" :key="drive.id" @click="onDriveSelected(drive)" :class="{'selected': isSelected('external') }">
      <img class="row__icon" src="@/assets/ic-sd-card-white.svg" v-if="isSelected('external') || defaultState"/>
      <img class="row__icon" src="@/assets/ic-sd-card-gray.svg" v-else/>
      <span class="row__source-title" :class="{'default': defaultState}">{{ drive.label }}</span>
      <AudioMothTag :show="drive.deviceId" :isSelected="(isSelected('external') || defaultState)"/>
    </tr>
    </template>
    <template>
    <tr class="source-type__row">
      <span class="source-type__title">Other sources</span>
    </tr>
    <tr @click="onClickChangeFolder" :class="{'selected':  isSelected('folder') }">
      <input type="file" ref="folder" webkitdirectory directory @change="handleFolderChange" style="display:none"/>
      <img class="row__icon" src="@/assets/ic-folder-empty-white.svg" v-if="isSelected('folder') || defaultState"/>
      <img class="row__icon" src="@/assets/ic-folder-empty.svg" v-else/>
      <span class="row__source-title" :class="{'default': defaultState}" v-if="selectedFolder.path">{{ selectedFolder.path }}</span>
      <span class="row__folder-button" :class="{'default': defaultState}" v-else>Choose a folder</span>
      <AudioMothTag :show="selectedFolder.deviceId" :isSelected="(isSelected('folder') || defaultState)"/>
    </tr>
    <tr @click="onClickChooseFiles" :class="{'selected':  isSelected('file') }">
      <input type="file" ref="file" multiple @change="handleFilesChange" style="display:none"/>
      <img class="row__icon" src="@/assets/ic-file-white.svg" v-if="isSelected('file') || defaultState"/>
      <img class="row__icon" src="@/assets/ic-file.svg" v-else/>
      <span class="row__source-title" :class="{'default': defaultState}" v-if="numberOfSelectedFiles > 0">{{ numberOfSelectedFiles + ' files selected' }}</span>
      <span class="row__folder-button" :class="{'default': defaultState}" v-else>Choose files</span>
      <AudioMothTag :show="isSelected('file') && selectedSource.deviceId" :isSelected="(isSelected('file') || defaultState)"/>
    </tr>
    </template>
  </table>
</template>

<script>
import DriveList from '../../../../utils/DriveListHelper'
import fileHelper from '../../../../utils/fileHelper'
import FileSource from './FileSorce'
import AudioMothTag from '../Common/Tag/AudioMothTag'

function getDeviceId (deviceInfo) {
  return deviceInfo ? deviceInfo.deviceId : null
}

function getDeploymentId (deviceInfo) {
  return deviceInfo ? deviceInfo.deploymentId : null
}

export default {
  data: () => ({
    driveFetchingInterval: null,
    drives: null,
    selectedSource: {},
    selectedFolder: {},
    selectedFiles: [],
    defaultState: true,
    isLoading: false // user hasn't selected any options before
  }),
  components: { AudioMothTag },
  computed: {
    numberOfSelectedFiles () {
      return this.selectedFiles.length
    },
    audioMothDrives () {
      if (this.drives === null || this.drives.length === 0) return []
      return this.drives.filter(drive => drive.deviceId)
    }
  },
  methods: {
    async getExternalDriveList () {
      this.isLoading = true
      const drives = await DriveList.getExternalDriveList()
      this.isLoading = false
      if (drives.length === 0) return
      this.drives = await Promise.all(drives.map(async drive => {
        const deviceInfo = await this.getDeviceInfo(drive.path)
        if (deviceInfo) {
          const deviceId = deviceInfo.deviceId
          const deploymentId = deviceInfo.deploymentId
          return {...drive, deviceId, deploymentId}
        }
        return drive
      }))
    },
    async getDeviceInfo (path) {
      return this.$file.getDeviceInfoFromFolder(path)
    },
    onDriveSelected (drive) {
      this.selectedSource = new FileSource.FileSourceFromExternal(drive.id, drive.deviceId, drive.deploymentId, drive.path, drive.label)
    },
    onClickChangeFolder () {
      this.$refs.folder.click()
    },
    async handleFolderChange (event) {
      console.log(event.target.files)
      const path = event.target.files[0].path
      const deviceInfo = await this.getDeviceInfo(path)
      const deviceId = getDeviceId(deviceInfo)
      const deploymentId = getDeploymentId(deviceInfo)
      this.selectedFolder = {path, deviceId, deploymentId}
      this.selectedSource = new FileSource.FileSourceFromFolder(path, deviceId, deploymentId)
      // reset selected files
      this.selectedFiles = []
    },
    async onClickChooseFiles () {
      this.$refs.file.click()
    },
    async handleFilesChange (event) {
      console.log(event.target.files)
      if (!event.target.files) { return }
      const files = [...event.target.files].map(file => {
        return {
          'lastModified': file.lastModified,
          'lastModifiedDate': file.lastModifiedDate,
          'name': file.name,
          'size': file.size,
          'type': file.type,
          'path': file.path
        }
      })
      this.selectedFiles = files
      const firstWavFile = files.find(file => fileHelper.getExtension(file.path) === 'wav') // read only wav file header info
      const deviceInfo = await this.$file.getDeviceInfo(firstWavFile)
      this.selectedSource = new FileSource.FileSourceFromFiles('id', getDeviceId(deviceInfo), getDeploymentId(deviceInfo), files)
      // reset selected folder
      this.selectedFolder = {}
    },
    isSelected (type) {
      switch (type) {
        case 'external': return this.selectedSource instanceof FileSource.FileSourceFromExternal
        case 'file': return this.selectedSource instanceof FileSource.FileSourceFromFiles
        case 'folder': return this.selectedSource instanceof FileSource.FileSourceFromFolder
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
  async created () {
    // fetch drive list for the first time
    await this.getExternalDriveList()

    // set an interval to fetch drive list every 5 secs
    this.driveFetchingInterval = setInterval(async () => {
      await this.getExternalDriveList()
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
