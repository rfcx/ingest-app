<template>
    <aside class="column menu side-menu">
        <div class="menu-container side-menu-title">
            <p class="menu-label"> {{ menuTitle }} </p>
            <router-link to="/add"><img src="~@/assets/ic-add.svg"></router-link>
        </div>
        <ul class="menu-list">
            <li v-for="stream in streams" :key="stream.id">
                <div class="menu-item" v-on:click="selectItem(stream)" :class="{ 'is-active': isActive(stream) }">
                    <div class="menu-container">
                        <span class="stream-title"> {{ stream.name }} </span>
                        <img :src="getStateImgUrl(stream.state)">
                    </div>
                    <div class="state-progress" v-if="!isSynced(stream)">
                        <progress class="progress is-primary" :value="stream.progress" max="100"></progress>
                        <div class="menu-container">
                            <span class="is-size-7">{{ stream.state }}</span>
                            <span class="is-size-7"> {{ stream.additional }} </span>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </aside>
</template>

<script>
  import db from '../../../../utils/db'
  import { mapState } from 'vuex'
  export default {
    data () {
      return {
        menuTitle: 'Streams',
        streams: db.getStreams()
      }
    },
    computed: {
      ...mapState({
        selectedStream: state => state.Stream.selectedStream
      })
    },
    methods: {
      getStateImgUrl (state) {
        return require(`../../assets/ic-state-${state}.svg`)
      },
      selectItem (stream) {
        db.setSelectedStream(stream)
        this.$store.dispatch('setSelectedStream', stream)
      },
      isActive (stream) {
        return stream.name === this.selectedStream.name
      },
      isSynced (stream) {
        return stream.state === 'completed'
      }
    }
  }
</script>
