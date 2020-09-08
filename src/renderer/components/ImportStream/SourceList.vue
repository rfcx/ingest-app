<template>
  <table>
    <template v-if="!drives || drives.length === 0">
      <tr>
        <img class="row__icon" src="@/assets/ic-sd-card-gray.svg"/>
        <span class="row__source-title" v-if="!drives">Finding external drives...</span>
        <span class="row__source-title" v-else>No SD Card detected</span>
      </tr>
    </template>
    <template v-else>
    <tr v-for="drive in drives" :key="drive.id" @click="onSourceSelected(drive)" :class="{'selected': isSelected('external', drive) }">
      <img class="row__icon" src="@/assets/ic-sd-card-white.svg" v-if="isSelected('external', drive) || defaultState"/>
      <img class="row__icon" src="@/assets/ic-sd-card-gray.svg" v-else/>
      <span class="row__source-title" :class="{'default': defaultState}">{{ drive.label }}</span>
    </tr>
    </template>
    <template>
    <tr @click="$refs.file.click()" :class="{'selected':  isSelected('folder') }">
      <input type="file" ref="file" webkitdirectory directory @change="handleFileChange" style="display:none"/>
      <img class="row__icon" src="@/assets/ic-folder-empty-white.svg" v-if="isSelected('folder') || defaultState"/>
      <img class="row__icon" src="@/assets/ic-folder-empty.svg" v-else/>
      <span class="row__source-title" :class="{'default': defaultState}" v-if="selectedFolderPath">{{ selectedFolderPath }}</span>
      <span class="row__folder-button" :class="{'default': defaultState}" v-else>Choose other folder...</span>
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
    selectedFolderPath: '',
    defaultState: true // user hasn't selected any options before
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
      this.defaultState = false
      this.$emit('sourceSelected', val)
    }
  },
  created () {
    this.getExternalDriveList()
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
</style>
