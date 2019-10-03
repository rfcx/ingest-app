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
                    <div class="state-progress" v-if="shouldShowProgress(stream)">
                        <progress class="progress is-primary" :value="getProgress(stream)" max="100"></progress>
                        <div class="menu-container">
                            <span class="is-size-7">{{ getState(stream) }}</span>
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
        stream['files'] = []
        this.$store.dispatch('setSelectedStream', stream)
      },
      isActive (stream) {
        return stream.id === this.selectedStream.id
      },
      shouldShowProgress (stream) {
        return this.getState(stream) === 'waiting' || this.getState(stream) === 'uploading'
      },
      getState (stream) {
        const isCompleted = stream.files.every(file => { return file.state === 'completed' })
        const isWaiting = stream.files.every(file => { return file.state === 'waiting' })
        const isFailed = stream.files.every(file => { return file.state === 'failed' })
        if (isCompleted) return 'completed'
        else if (isWaiting) return 'waiting'
        else if (isFailed) return 'failed'
        return 'uploading'
      },
      getProgress (stream) {
        const state = this.getState(stream)
        if (state === 'completed') return 100
        else if (state === 'waiting' || state === 'failed') return 0
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        return completedFiles.length / stream.files.length * 100
      }
    }
  }
</script>
