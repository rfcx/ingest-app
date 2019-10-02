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
                        <img :src="getStateImgUrl(getState(stream))">
                    </div>
                    <div class="state-progress" v-if="!isSynced(stream)">
                        <progress class="progress is-primary" :value="getProgress(stream)" max="100"></progress>
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
  import { mapState } from 'vuex'
  import Stream from '../../store/models/Stream'

  export default {
    data () {
      return {
        menuTitle: 'Streams'
      }
    },
    computed: {
      ...mapState({
        selectedStream: state => state.Stream.selectedStream
      }),
      streams () {
        return Stream.query().with('files').get()
      }
    },
    methods: {
      getStateImgUrl (state) {
        return require(`../../assets/ic-state-${state}.svg`)
      },
      selectItem (stream) {
        this.$store.dispatch('setSelectedStream', stream)
      },
      isActive (stream) {
        return stream.id === this.selectedStream.id
      },
      isSynced (stream) {
        return this.getState(stream) === 'completed'
      },
      getState (stream) {
        const isCompleted = stream.files.every(file => { return file.state === 'completed' })
        const isWaiting = stream.files.every(file => { return file.state === 'waiting' })
        if (isCompleted) return 'completed'
        else if (isWaiting) return 'waiting'
        return 'uploading'
      },
      getProgress (stream) {
        const state = this.getState(stream)
        if (state === 'completed') return 100
        else if (state === 'waiting') return 0
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        return completedFiles.length / stream.files.length * 100
      }
    }
  }
</script>
