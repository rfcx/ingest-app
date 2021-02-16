<template>
  <div class="file-tab__wrapper">
    <div class="tabs is-fullwidth">
      <ul>
        <li
          v-for="tab in tabGroups"
          :key="tab"
          :class="{ 'is-active': selectedTab ? tab === selectedTab : tab === 'Prepared' }"
          @click="setActive(tab)"
        >
          <a>
            <img class="file-tab__fail-icon" :src="require(`../../../assets/ic-state-failed.svg`)" v-if="hasFailedFiles(tab)" />
            <span>{{tab}} ({{getNumberOfFiles(tab)}})</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  data () {
    return {
      tabGroups: ['Prepared', 'Queued', 'Completed']
    }
  },
  props: {
    preparingFiles: Array,
    queuingFiles: Array,
    completedFiles: Array,
    selectedTab: String
  },
  computed: {
    ...mapState({
      selectedStreamId: (state) => state.AppSetting.selectedStreamId
    })
  },
  methods: {
    getFiles (tab) {
      switch (tab) {
        case 'Prepared':
          return this.preparingFiles
        case 'Queued':
          return this.queuingFiles
        case 'Completed':
          return this.completedFiles
      }
    },
    getNumberOfFiles (tab) {
      return this.getFiles(tab).length
    },
    hasFailedFiles (tab) {
      return this.getFiles(tab).filter((file) => file.isError).length > 0
    },
    setActive (tab) {
      const tabObject = {}
      tabObject[this.selectedStreamId] = tab
      this.$store.dispatch('setSelectedTab', tabObject)
    }
  }
}
</script>

<style lang="scss" scoped>
  .file-tab {
    &__wrapper {
      padding-bottom: $default-padding-margin;
    }
    &__fail-icon {
      padding-right: $default-padding-margin;
    }
  }
  .tabs {
    ul {
      margin-left: 0px !important;
    }
    .is-active {
      font-weight: $title-font-weight;
    }
  }
</style>
