<template>
  <div class="landing__tab-wrapper">
    <div class="tabs is-fullwidth">
      <ul>
        <li v-for="tab in tabGroups" :key="tab" :class="{ 'is-active': selectedTab ? tab === selectedTab : tab === 'Prepared' }" @click="setActive(tab)">
          <a><span>{{tab}} ({{getNumberOfFiles(tab)}})</span></a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import FileState from '../../../../../utils/fileState'

export default {
  data () {
    return {
      tabGroups: ['Prepared', 'Queued', 'Completed']
    }
  },
  props: {
    files: Array
  },
  computed: {
    ...mapState({
      selectedTab: state => state.AppSetting.selectedTab
    })
  },
  methods: {
    getNumberOfFiles (tab) {
      switch (tab) {
        case 'Prepared':
          return this.files.filter(file => FileState.isInPreparedGroup(file.state)).length
        case 'Queued':
          return this.files.filter(file => FileState.isInQueuedGroup(file.state)).length
        case 'Completed':
          return this.files.filter(file => FileState.isInCompletedGroup(file.state)).length
      }
    },
    setActive (tab) {
      this.$store.dispatch('setSelectedTab', tab)
    }
  }
}
</script>

<style lang="scss">
  .tabs ul {
    border-bottom-color: transparent;
  }
  .tabs .is-active {
    font-weight: $title-font-weight;
  }
</style>
