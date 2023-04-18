<template>
<div class="wrapper">
  <div class="flex-end">
    <button
      type="button"
      class="button is-rounded is-cancel"
      :class="{ 'is-loading': isRemoveQueuedFiles }"
      :disabled="!queuedFileCount"
      @click.prevent="removeQueuedFiles()"
    >Cancel all</button>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'
import FileState from '../../../../../utils/fileState'

export default {
  props: {
    queuedFileCount: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      isRemoveQueuedFiles: false
    }
  },
  computed: {
    ...mapState({
      selectedStreamId: state => state.AppSetting.selectedStreamId
    })
  },
  methods: {
    async removeQueuedFiles () {
      if (this.isRemoveQueuedFiles) return // prevent double click
      this.isRemoveQueuedFiles = true
      try {
        const state = [FileState.state.WAITING]
        await this.$file.removeQueuedFiles(this.selectedStreamId, state)
        // set selected tab to be a prepared tab
        const tabObject = {}
        tabObject[this.selectedStreamId] = 'Prepared'
        await this.$store.dispatch('setSelectedTab', tabObject)
      } catch (e) {
        this.isRemoveQueuedFiles = false
        console.error('[FileQueued] error remove queued files', e)
      }
    }
  },
  watch: {
    queuedFileCount: {
      handler: async function (newValue, previousValue) {
        if (previousValue === newValue) return
        this.queuedFileCount = newValue
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    padding: $default-padding;
    display: flex;
    justify-content: space-between;
    align-self: center;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .flex-end {
    justify-content: flex-end;
    margin-left: auto;
  }
</style>
