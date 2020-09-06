<template>
  <table>
    <template v-if="false">
      <tr>
        <img src="@/assets/ic-sd-card-gray.svg"/>
        <span class="source-list__source-title">No SD Card detected</span>
      </tr>
    </template>
    <template v-else>
    <tr :class="{'selected': true }">
      <img src="@/assets/ic-sd-card-white.svg"/>
      <span class="source-list__source-title">test1</span>
    </tr>
    </template>
    <!-- <template>
    <tr :class="{'selected': true }">
      <span class="source-list__folder-title">Choose other folder</span>
    </tr>
    </template> -->
  </table>
</template>

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
