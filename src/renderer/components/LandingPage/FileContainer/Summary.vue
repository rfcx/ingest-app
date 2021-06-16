<template>
<div class="wrapper">
  <div>
    <div class="tabs is-toggle">
      <ul>
        <li class="item"
          v-for="stat in statsToRender"
          :key="stat.id"
        >
          <a>
            <img :src="getStateImgUrl(stat.id)" />
            <div>
              <p class="item__number is-size-6">{{stat.number}}</p>
              <p class="item__status is-size-7">{{stat.name}}</p>
            </div>
          </a>
        </li>
      </ul>
    </div>
    <span class="info-text is-size-7">Completed uploads are shown for up to 30 days. To see all uploads, open in Arbimon.</span>
  </div>
  <div>
    <button type="button" class="button is-rounded is-cancel" :class="{ 'is-loading': isRetryUploading }" @click.prevent="repeatUploading" :disabled="isRetryUploading || retryableFileCount < 1">
      Retry upload ({{retryableFileCount}})
    </button>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'
import FileState from '../../../../../utils/fileState'
import ipcRendererSend from '../../../services/ipc'

export default {
  props: {
    stats: Array,
    retryableFileCount: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      isRetryUploading: false
    }
  },
  computed: {
    ...mapState({
      selectedStreamId: state => state.AppSetting.selectedStreamId
    }),
    statsToRender () {
      const uniquedGroupNameInCompletedTab = FileState.completedGroup
        .map(state => { return { id: state, name: FileState.getName(state) } })
        .filter(state => state.name !== undefined)
      return uniquedGroupNameInCompletedTab.map(state => {
        const stat = this.stats.find(s => s.state === state.id)
        return { ...state, number: stat ? stat.stateCount : 0 }
      }).sort((a, b) => FileState.getSummaryStatePriority(a.id) - FileState.getSummaryStatePriority(b.id))
    }
  },
  methods: {
    getStateImgUrl (state) {
      if (FileState.isPreparing(state)) return ''
      const iconName = FileState.getIconName(state)
      return require(`../../../assets/${iconName}`)
    },
    isFailed (state) {
      return FileState.isError(state)
    },
    async repeatUploading () {
      if (this.isRetryUploading) return // prevent double click
      this.isRetryUploading = true
      try {
        let files = await ipcRendererSend('db.files.query', `db.files.query.${Date.now()}`, { where: { streamId: this.selectedStreamId, state: [FileState.state.ERROR_SERVER] } })
        files = files.filter((f) => { return FileState.canRedo(f.state, f.stateMessage) })
        await this.$file.putFilesIntoUploadingQueue(files)
        this.isRetryUploading = false
      } catch (e) {
        this.isRetryUploading = false
        console.log('error retry upload', e)
      }

      // set selected tab to be queue tab
      const tabObject = {}
      tabObject[this.selectedStreamId] = 'Queued'
      await this.$store.dispatch('setSelectedTab', tabObject)
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
  .tabs {
    margin: 0px !important;
    ul {
      margin: 0px !important;
    }
  }
  .summary {
    &__title {
      font-weight: $title-font-weight;
      color: $secondary-text-color;
      display: block;
    }
  }
  .item {
    a {
      height: 40px;
      cursor: default;
    }
    img {
      padding-right: 4px;
    }
    p {
      display: inline-block;
      margin-bottom: 0 !important;
    }
    &__number {
      text-align: center;
    }
  }
  .info-text {
    color: $secondary-text-color;
  }

  .icon-redo {
    cursor: pointer;
    font-size: 10px;
  }

</style>
