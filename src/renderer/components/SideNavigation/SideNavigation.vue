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
                        <span class="stream-title"> {{ stream.name }} (_{{ stream.id.substring(0, 4) }}) </span>
                        <img :src="getStateImgUrl(getState(stream))">
                    </div>
                    <div class="state-progress" v-if="shouldShowProgress(stream)">
                        <progress class="progress is-primary" :value="getProgress(stream)" max="100"></progress>
                        <div class="menu-container">
                            <span class="is-size-7">{{ getState(stream) }}</span>
                            <span class="is-size-7"> {{ getStateStatus(stream) }} </span>
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
        selectedStreamId: state => state.Stream.selectedStreamId
      }),
      selectedStream () {
        return Stream.find(this.selectedStreamId)
      },
      streams () {
        return Stream.query().with('files').get()
      }
    },
    methods: {
      getStateImgUrl (state) {
        return require(`../../assets/ic-state-${state}.svg`)
      },
      selectItem (stream) {
        this.$store.dispatch('setSelectedStreamId', stream.id)
      },
      isActive (stream) {
        if (this.selectedStream === null) return false
        return stream.id === this.selectedStream.id
      },
      shouldShowProgress (stream) {
        return this.getState(stream) !== 'completed' && this.getState(stream) !== 'failed'
      },
      getState (stream) {
        const isCompleted = stream.files.every(file => { return file.state === 'completed' })
        const isWaiting = stream.files.every(file => { return file.state === 'waiting' })
        const isFailed = stream.files.every(file => { return file.state === 'failed' })
        const isIngesting = stream.files.every(file => { return file.state === 'completed' || file.state === 'ingesting' || file.state === 'failed' })
        if (isCompleted) return 'completed'
        else if (isWaiting) return 'waiting'
        else if (isFailed) return 'failed'
        else if (isIngesting) return 'ingesting'
        return 'uploading'
      },
      getProgress (stream) {
        const state = this.getState(stream)
        if (state === 'completed') return 100
        else if (state === 'waiting' || state === 'failed') return 0
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        const uploadedFiles = stream.files.filter(file => { return file.state === 'ingesting' || file.state === 'completed' })
        const completedPercentage = completedFiles.length / (stream.files.length * 2) * 100
        const uploadedPercentage = uploadedFiles.length / (stream.files.length * 2) * 100
        console.log(`completed files ${completedFiles.length} = ${completedPercentage}% | completed files ${uploadedFiles.length} = ${uploadedPercentage}%`)
        return completedPercentage + uploadedPercentage
      },
      getStateStatus (stream) {
        const state = this.getState(stream)
        if (state === 'completed' || state === 'failed') return ''
        else if (state === 'waiting') return stream.files.length + (stream.files.length > 1 ? ' files' : ' file')
        const completedFiles = stream.files.filter(file => { return file.state === 'completed' })
        const errorFiles = stream.files.filter(file => { return file.state === 'failed' })
        if (errorFiles.length < 1) return `${completedFiles.length}/${stream.files.length} ingested`
        return `${completedFiles.length}/${stream.files.length} ingested | ${errorFiles.length} ${errorFiles.length > 1 ? 'errors' : 'error'}`
      }
    }
  }
</script>
