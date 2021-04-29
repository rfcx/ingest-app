<template>
<div class="wrapper">
  <!-- <span class="summary__title">Summary</span> -->
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
</div>
</template>

<script>
import FileState from '../../../../../utils/fileState'
export default {
  props: {
    stats: Array
  },
  computed: {
    statsToRender () {
      const uniquedGroupNameInCompletedTab = FileState.completedGroup
        .map(state => { return { id: state, name: FileState.getName(state) } })
        .filter(state => state.name !== undefined)
      return uniquedGroupNameInCompletedTab.map(state => {
        console.log('state', state)
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
    }
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    padding: $default-padding;
  }
  .tabs {
    ul {
      margin-left: 0px !important;
      margin-top: 0px;
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
</style>