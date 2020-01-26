<template>
<div id="wrapper-fs-service">FS Service</div>
</template>

<script>
  import Stream from '../store/models/Stream'

  export default {
    computed: {
      streams () {
        return Stream.query().get()
      }
    },
    watch: {
      streams (val, oldVal) {
        console.log('watch streams changes')
        const oldIds = oldVal.map((stream) => { return stream.id })
        const newIds = val.map((stream) => { return stream.id })
        if (JSON.stringify(oldIds) === JSON.stringify(newIds)) return
        this.subscribeForFileChanges()
      }
    },
    methods: {
      subscribeForFileChanges () {
        console.log('subscribeForFileChanges')
        this.streams.forEach(stream => {
          this.$file.watchingStream(stream)
        })
      }
    },
    created () {
      console.log('FS Service')
      this.subscribeForFileChanges()
    }
  }
</script>
