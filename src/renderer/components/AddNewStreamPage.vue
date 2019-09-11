<template>
  <div id="wrapper">
    <navigation></navigation>
  </div>
</template>

<script>
  import Navigation from './Navigation/Navigation'

  export default {
    name: 'add-new-stream-page',
    components: { Navigation },
    methods: {
      open (link) {
        this.$electron.shell.openExternal(link)
      }
    }
  }
</script>