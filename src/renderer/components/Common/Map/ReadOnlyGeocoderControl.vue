<template>
  <div class="wrapper">
    <div class="mapboxgl-control-container">
      <div class="mapboxgl-ctrl-bottom-right">
        <div class="mapboxgl-ctrl-geocoder mapboxgl-ctrl">
        <input class="mapboxgl-ctrl-geocoder--input" type="text" :v-model="coordinateTitle" :placeholder="coordinateTitle" disabled>
      </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    coordinates: {
      type: Array
    }
  },
  computed: {
    coordinateTitle () {
      if (!this.coordinates || this.coordinates.length < 2) return ''
      const [lng, lat] = this.coordinates
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }
}
</script>
<style lang="scss" scoped>
  .wrapper {
    position: relative;
  }
  .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl {
    margin-bottom: 30px;
  }
</style>