<template>
  <MglMap :accessToken="accessToken" :mapStyle="mapStyle" logoPosition="bottom-left">
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
      @result="onSelected"
    />
    <MglMarker :coordinates="selectedCoordinates">
      <div slot="marker" class="map-marker" title="marker">
        <img src="@/assets/ic-map-marker.png" alt class="map-marker__icon" />
      </div>
    </MglMarker>
  </MglMap>
</template>

<script>
import Mapbox from 'mapbox-gl'
import { MglMap, MglMarker } from 'vue-mapbox'
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
      selectedCoordinates: [0, 0]
    }
  },
  components: { MglMap, GeocoderControl, MglMarker },
  methods: {
    onSelected (event) {
      console.log(`onselected`)
      console.log(event)
      this.selectedCoordinates = event.result.center
      this.$emit('locationSelected', this.selectedCoordinates)
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
  created () {
    this.mapbox = Mapbox
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
    font-size: 16px;
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
  font-size: 17px;
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
</style>
