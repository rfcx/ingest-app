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
    <tr :class="{'selected': true }" v-for="drive in drives" :key="drive.id">
      <img src="@/assets/ic-sd-card-white.svg"/>
      <span class="source-list__source-title">{{ drive.label }}</span>
    </tr>
    </template>
    <!-- <template>
    <tr :class="{'selected': true }">
      <span class="source-list__folder-title">Choose other folder</span>
    </tr>
    </template> -->
  </table>
</template>

<script>
import DriveList from '../../../../utils/DriveListHelper'
export default {
  data: () => ({
    drives: []
  }),
  methods: {
    async getExternalDriveList () {
      DriveList.getExternalDriveList().then(drives => {
        this.drives = drives
      })
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
