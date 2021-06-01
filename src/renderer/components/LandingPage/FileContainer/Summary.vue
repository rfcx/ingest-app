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
              <fa-icon v-if="isFailed(stat.id)" class="icon-redo" :icon="icons.redo" @click="repeatUploading(file)" />
            </div>
          </a>
        </li>
      </ul>
    </div>
    <span class="info-text is-size-7">Completed uploads are shown for up to 30 days. To see all uploads, open in Arbimon.</span>
  </div>
</div>
</template>

<script>
import { faRedo } from '@fortawesome/free-solid-svg-icons'
import FileState from '../../../../../utils/fileState'
export default {
  props: {
    stats: Array
  },
  computed: {
    icons () {
      return {
        redo: faRedo
      }
    },
    statsToRender () {
      const uniquedGroupNameInCompletedTab = FileState.completedGroup
        .map(state => { return { id: state, name: FileState.getName(state) } })
        .filter(state => state.name !== undefined)
      return uniquedGroupNameInCompletedTab.map(state => {
        const stat = this.stats.find(s => s.state === state.id)
        return { ...state, number: stat ? stat.stateCount : 0 }
      }).sort((a, b) => FileState.getStatePriority(a.id) - FileState.getStatePriority(b.id))
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
    }
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    padding: $default-padding;
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