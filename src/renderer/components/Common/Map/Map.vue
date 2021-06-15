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
      :input.sync="defaultInput"
      :mapboxgl="mapbox"
      :localGeocoder="coordinatesGeocoder"
      :zoom="10"
      :minLength="3"
      :autocomplete="false"
      placeholder="search by latitude, longitude"
      position="bottom-right"
      types="country,region,postcode,district,place,locality,neighborhood"
      @result="onSelected"
      v-if="!isReadOnly"
    />
    <ReadOnlyGeoCoderControl :coordinates="selectedCoordinates" v-else/>
    <MglNavigationControl position="top-right" :showZoom="true" :showCompass="false" />
    <MglMarker v-if="selectedCoordinates && selectedCoordinates.length" :coordinates="selectedCoordinates" :draggable="!isReadOnly" @dragend="getPlacePositionByDrop">
      <div slot="marker" class="map-marker" :title="getMarkerTitle()">
        <img src="@/assets/ic-map-marker.png" alt class="map-marker__icon" />
      </div>
    </MglMarker>
  </MglMap>
</template>

<script>
import Mapbox from 'mapbox-gl'
import { MglMap, MglMarker, MglNavigationControl } from 'vue-mapbox'
import GeocoderControl from '../Map/GeocoderControl'
import ReadOnlyGeoCoderControl from '../Map/ReadOnlyGeocoderControl'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

export default {
  data () {
    return {
      accessToken:
        'pk.eyJ1IjoicmZjeCIsImEiOiJoMEptMnlJIn0.LPKrjG_3AeYB5cqsyLpcrg',
      mapStyle: 'mapbox://styles/rfcx/ck9g6dci83g3x1io8dl27r7aq',
      defaultInput: '',
      center: [15, 30],
      zoom: 2,
      closeMapZoom: 8,
      selectedCoordinates: [],
      isDraggable: false
    }
  },
  components: { MglMap, GeocoderControl, MglMarker, MglNavigationControl, ReadOnlyGeoCoderControl },
  props: ['title', 'initialCoordinates', 'isReadOnly'],
  methods: {
    getMarkerTitle () {
      return this.title ? this.title : 'marker'
    },
    onSelected (event) {
      this.selectedCoordinates = event.result.center
    },
    getPlacePositionByDrop (event) {
      if (this.isReadOnly) return
      this.isDraggable = true
      var lngLat = event.marker.getLngLat()
      const lng = lngLat.lng
      const lat = lngLat.lat
      this.selectedCoordinates = [lng, lat]
      this.updateTextInput(lng, lat)
      setTimeout(() => { this.isDraggable = false }, 100)
    },
    getPlacePositionByClick (event) {
      if (this.isDraggable || this.isReadOnly) return
      if (event.mapboxEvent.lngLat) {
        const lng = event.mapboxEvent.lngLat.lng
        const lat = event.mapboxEvent.lngLat.lat
        this.selectedCoordinates = [lng, lat]
        this.updateTextInput(lng, lat)
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
    updateTextInput (lng, lat) {
      this.defaultInput = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
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
    },
    updateCoordinates (coordinates) {
      console.log('updateCoordinates', coordinates)
      this.selectedCoordinates = coordinates
      this.updateTextInput(coordinates[0], coordinates[1])
      this.center = coordinates
      this.zoom = this.closeMapZoom
    },
    resetCoordinates () {
      this.selectedCoordinates = []
      this.updateMapCoordinatesForMarker()
      this.defaultInput = ''
    }
  },
  watch: {
    selectedCoordinates (val, oldVal) {
      if (val === oldVal || val.length !== 2) return
      this.updateMapCoordinatesForMarker(val[0], val[1])
      this.$emit('locationSelected', val)
    },
    initialCoordinates (val, oldVal) {
      if (val === oldVal) return
      if (val === null || val.length < 2) this.resetCoordinates()
      else this.updateCoordinates(val)
    }
  },
  created () {
    this.mapbox = Mapbox
    if (this.initialCoordinates) {
      this.updateCoordinates(this.initialCoordinates)
    }
  }
}
</script>

<style lang="scss">
  mgl-map {
    width: $full-width;
    height: $full-height;
    position: relative;
    z-index: 1;
  }

  .mapboxgl-map {
    &:after {
      bottom: 0;
      background: $backgroud-color-dark;
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
    fill: $white-color;
  }
  &--suggestion {
    color: $white-color;
    &:hover,
    &:active {
      background-color: $button-hover-border-color !important;
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
    color: $edit-icon-color !important;
  }
  .suggestions {
    top: auto;
    bottom: 40px;
    max-height: 80px !important;
    overflow: auto;
    background-color: rgba(46, 49, 69, 0.9);
    text-align: left;
    .active a {
      background-color: $button-hover-border-color !important;
      color: rgb(192, 189, 189) !important;
      margin-bottom: 2px;
    }
    li,
    a {
      &:hover,
      &:active {
        background-color: $button-hover-border-color !important;
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
  color: $white-color;
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
  width: $full-width;
  height: $full-height;
  background-repeat: no-repeat;
  background-position: 50%;
}

.mapboxgl-ctrl button.mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M14.5 8.5c-.75 0-1.5.75-1.5 1.5v3h-3c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h3v3c0 .75.75 1.5 1.5 1.5S16 19.75 16 19v-3h3c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-3v-3c0-.75-.75-1.5-1.5-1.5z'/%3E%3C/svg%3E");
}

.mapboxgl-ctrl button.mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M10 13c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h9c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-9z'/%3E%3C/svg%3E");
}

.map-wrapper {
  height: 250px;
  width: $wrapper-width;
  margin-bottom: $default-padding-margin;
  .mapboxgl-canvas {
    height: 250px !important;
  }
}
</style>
