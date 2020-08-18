<template>
  <MglMap
    :accessToken="accessToken"
    :mapStyle="mapStyle"
    :center="center"
    :zoom="zoom"
    logoPosition="bottom-left"
    @click="getPlacePositionByClick">
    <GeocoderControl
      :accessToken="accessToken"
      :limit="1"
      :input.sync="defaultInput"
      :mapboxgl="mapbox"
      :localGeocoder="coordinatesGeocoder"
      :zoom="10"
      :minLength="3"
      :autocomplete="false"
      placeholder="search by latitude, longitude"
      position="bottom-right"
      @result="onSelected"
    />
    <MglNavigationControl position="top-right" :showZoom="true" :showCompass="false" />
    <MglMarker v-if="selectedCoordinates && selectedCoordinates.length" :coordinates="selectedCoordinates" :draggable="true" @dragend="getPlacePositionByDrop">
      <div slot="marker" class="map-marker" :title="getMarkerTitle()">
        <img src="@/assets/ic-map-marker.png" alt class="map-marker__icon" />
      </div>
    </MglMarker>
  </MglMap>
</template>

<script>
import Mapbox from 'mapbox-gl'
import { MglMap, MglMarker, MglNavigationControl } from 'vue-mapbox'
import GeocoderControl from './GeocoderControl'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

export default {
  data () {
    return {
      accessToken:
        'pk.eyJ1IjoicmZjeCIsImEiOiJoMEptMnlJIn0.LPKrjG_3AeYB5cqsyLpcrg',
      mapStyle: 'mapbox://styles/rfcx/ck9g6dci83g3x1io8dl27r7aq',
      defaultInput: '',
      searchLimit: 1,
      center: [15, 30],
      zoom: 2,
      closeMapZoom: 8,
      selectedCoordinates: [],
      isDraggable: false
    }
  },
  components: { MglMap, GeocoderControl, MglMarker, MglNavigationControl },
  props: ['title', 'lngLat'],
  methods: {
    getMarkerTitle () {
      return this.title ? this.title : 'marker'
    },
    onSelected (event) {
      console.log(`onselected`)
      console.log(event)
      this.selectedCoordinates = event.result.center
    },
    getPlacePositionByDrop (event) {
      this.isDraggable = true
      var lngLat = event.marker.getLngLat()
      this.selectedCoordinates = [lngLat.lng, lngLat.lat]
      setTimeout(() => { this.isDraggable = false }, 100)
    },
    getPlacePositionByClick (event) {
      if (this.isDraggable) return
      if (event.mapboxEvent.lngLat) {
        this.selectedCoordinates = [event.mapboxEvent.lngLat.lng, event.mapboxEvent.lngLat.lat]
      }
    },
    updateMapCoordinatesForMarker (lng, lat) {
      if (lng && lat) {
        this.center = [lng, lat]
        this.zoom = this.closeMapZoom
      } else {
        this.center = [15, 30]
        this.zoom = 2
      }
    },
    coordinatesGeocoder (query) {
      const matches = query.match(/^(-?\d+\.?\d*)[, ]+(-?\d+\.?\d*)[ ]*$/i)
      if (!matches) return null
      const coordinateFeature = (lat, lng) => {
        return {
          center: [lng, lat],
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          place_name: 'latitude: ' + lat + ' longitude: ' + lng,
          place_type: ['coordinate'],
          properties: {},
          type: 'Feature'
        }
      }
      const coord1 = Number(matches[1])
      const coord2 = Number(matches[2])
      let geocodes = []

      if (coord1 > -90 && coord1 < 90 && coord2 > -180 && coord2 < 180) {
        geocodes.push(coordinateFeature(coord1, coord2))
      }

      return geocodes
    }
  },
  watch: {
    selectedCoordinates (val, oldVal) {
      if (val === oldVal || val.length !== 2) return
      console.log('new location selected', val)
      this.updateMapCoordinatesForMarker(val[0], val[1])
      this.$emit('locationSelected', val)
    }
  },
  created () {
    this.mapbox = Mapbox
    if (this.lngLat) {
      this.selectedCoordinates = this.lngLat
      this.center = this.lngLat
      this.zoom = this.closeMapZoom
    }
  }
}
</script>

<style lang="scss">
mgl-map {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.mapboxgl-map {
  &:after {
    bottom: 0;
    background: rgb(19, 21, 37);
    background: -moz-linear-gradient(
      90deg,
      rgba(19, 21, 37, 0) 0%,
      rgba(19, 21, 37, 0.9) 85%,
      rgba(19, 21, 37, 1) 100%
    );
    background: -webkit-linear-gradient(
      90deg,
      rgba(19, 21, 37, 0) 0%,
      rgba(19, 21, 37, 0.9) 85%,
      rgba(19, 21, 37, 1) 100%
    );
    background: linear-gradient(
      90deg,
      rgba(19, 21, 37, 0) 0%,
      rgba(19, 21, 37, 0.9) 85%,
      rgba(19, 21, 37, 1) 100%
    );
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#131525",endColorstr="#131525",GradientType=1);
  }
}

.mapboxgl-ctrl-bottom-right {
  width: 50%;
  button {
    box-shadow: none;
  }
}

.mapboxgl-marker {
  svg {
    visibility: hidden;
  }
}

.mapboxgl-ctrl-geocoder {
  right: 20%;
  float: none;
  width: 362px;
  border-radius: 4px;
  background-color: rgba(46, 49, 69, 0.97);
  &--icon-search,
  &--icon-close,
  &--icon-loading {
    fill: #ffffff;
  }
  &--suggestion {
    color: #ffffff;
    &:hover,
    &:active {
      background-color: #3b3e53 !important;
      color: rgb(192, 189, 189) !important;
    }
  }
  &--button {
    background-color: rgba(46, 49, 69, 0.97);
  }
  &--input {
    font-size: $default-font-size;
    font-weight: 500;
    font-stretch: normal;
    font-style: normal;
    line-height: 0.86;
    letter-spacing: normal;
    color: #9b9b9b !important;
  }
  .suggestions {
    top: auto;
    bottom: 40px;
    max-height: 80px !important;
    overflow: auto;
    background-color: rgba(46, 49, 69, 0.9);
    text-align: left;
    .active a {
      background-color: #3b3e53 !important;
      color: rgb(192, 189, 189) !important;
      margin-bottom: 2px;
    }
    li,
    a {
      &:hover,
      &:active {
        background-color: #3b3e53 !important;
        color: rgb(192, 189, 189) !important;
      }
    }
  }
}

::-webkit-input-placeholder,
::-moz-placeholder,
:-ms-input-placeholder {
  opacity: 0.57;
  font-family: Lato;
  font-size: $default-font-size;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: #ffffff;
}

.mapboxgl-ctrl {
  .mapboxgl-ctrl-logo {
    visibility: hidden;
  }
  &.mapboxgl-ctrl-group {
    margin-top: 0;
  }
  &.mapboxgl-ctrl-attrib {
    visibility: hidden;
  }
}

.map-marker {
  &__icon {
    display: block;
    cursor: pointer;
    width: 26px;
    height: auto;
    margin-bottom: 1px;
  }
}

.mapboxgl-ctrl-top-right {
  right: 10px;
  top: 10px;
}

.mapboxgl-canvas {
  &:focus {
    outline: none !important;
  }
}

.mapboxgl-ctrl-icon {
  display: block;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-position: 50%;
}

.mapboxgl-ctrl button.mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M14.5 8.5c-.75 0-1.5.75-1.5 1.5v3h-3c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h3v3c0 .75.75 1.5 1.5 1.5S16 19.75 16 19v-3h3c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-3v-3c0-.75-.75-1.5-1.5-1.5z'/%3E%3C/svg%3E");
}

.mapboxgl-ctrl button.mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M10 13c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h9c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-9z'/%3E%3C/svg%3E");
}

</style>
