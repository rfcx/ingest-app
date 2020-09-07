<template>
  <table>
    <template v-if="!drives || drives.length === 0">
      <tr>
        <img src="@/assets/ic-sd-card-gray.svg"/>
        <span class="source-list__source-title" v-if="!drives">Finding external drives...</span>
        <span class="source-list__source-title" v-else>No SD Card detected</span>
      </tr>
    </template>
    <template v-else>
    <tr v-for="drive in drives" :key="drive.id" @click="onSourceSelected(drive)" :class="{'selected': isSelected('external', drive) }">
      <img src="@/assets/ic-sd-card-white.svg" v-if="isSelected('external', drive)"/>
      <img src="@/assets/ic-sd-card-gray.svg" v-else/>
      <span class="source-list__source-title">{{ drive.label }}</span>
    </tr>
    </template>
    <template>
    <tr @click="$refs.file.click()" :class="{'selected':  isSelected('folder') }">
      <input type="file" ref="file" webkitdirectory directory @change="handleFileChange" style="display:none"/>
      <img src="@/assets/ic-sd-card-white.svg" v-if="isSelected('folder')"/>
      <img src="@/assets/ic-sd-card-gray.svg" v-else-if="selectedFolderPath"/>
      <span class="source-list__folder-title">{{ selectedFolderPath || 'Choose other folder...' }} </span>
    </tr>
    </template>
  </table>
</template>

<script>
import DriveList from '../../../../utils/DriveListHelper'
export default {
  data: () => ({
    drives: [],
    selectedSource: {},
    selectedFolderPath: ''
  }),
  methods: {
    async getExternalDriveList () {
      DriveList.getExternalDriveList().then(drives => {
        this.drives = drives
      })
    },
    onSourceSelected (source) {
      this.selectedSource = source
    },
    handleFileChange (event) {
      console.log(event.target.files)
      this.selectedFolderPath = event.target.files[0].path
      this.selectedSource = {id: this.selectedFolderPath, label: this.selectedFolderPath, path: this.selectedFolderPath}
    },
    isSelected (type, drive = null) {
      switch (type) {
        case 'external': return drive.id === this.selectedSource.id
        case 'folder': return this.selectedSource.path === this.selectedFolderPath
        default: return false
      }
    }
  },
  watch: {
    selectedSource (val, oldVal) {
      if (val === oldVal) return
      this.$emit('sourceSelected', val)
    }
  },
  created () {
    this.getExternalDriveList()
  }
}
</script>

<style lang="scss" scoped>
  table {
    margin: $default-padding-margin 0px;
  }
  tr {
    margin-bottom: $default-padding-margin;
    height: 40px;
    img,
    .source-list__folder-title {
      vertical-align: middle;
      padding: $default-padding-margin;
    }
    span {
      color: $secondary-text-color;
    }
    &.selected span {
      color: $body-text-color;
    }
    &:hover {
      cursor: pointer;
    }
  }
</style>
