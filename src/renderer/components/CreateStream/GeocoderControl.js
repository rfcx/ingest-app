import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import { $helpers } from 'vue-mapbox'

const geocoderEvents = {
  clear: 'clear',
  loading: 'loading',
  results: 'results',
  result: 'result',
  error: 'error'
}

// TODO:
// If user searches for coordinates like "34,", the lib will return 422 error, which actually not affect on the UI/UX.
// It's not something we can fix on our side. So we need to get back to the following issue after some time:
// https://github.com/mapbox/mapbox-gl-geocoder/issues/274

export default {
  name: 'GeocoderControl',
  mixins: [$helpers.asControl],

  inject: ['mapbox', 'map'],

  props: {
    position: {
      type: String,
      default: 'top-right'
    },
    container: {
      type: String,
      default: null
    },
    // Mapbox-geocoder options
    accessToken: {
      type: String,
      required: true
    },
    zoom: {
      type: Number,
      default: 16
    },
    flyTo: {
      type: Boolean,
      default: true
    },
    placeholder: {
      type: String,
      default: 'Search'
    },
    proximity: {
      type: Object,
      default: null
    },
    trackProximity: {
      type: Boolean,
      default: false
    },
    bbox: {
      type: Array,
      default: null
    },
    types: {
      type: String,
      default: null
    },
    country: {
      type: String,
      default: null
    },
    minLength: {
      type: Number,
      default: 2
    },
    limit: {
      type: Number,
      default: 5
    },
    language: {
      type: String,
      default: null
    },
    filter: {
      type: Function,
      default: null
    },
    localGeocoder: {
      type: Function,
      default: null
    },
    // Component options
    input: {
      type: String,
      default: null
    },
    mapboxgl: {
      type: Object,
      default: null
    },
    localGeocoderOnly: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      initial: true
    }
  },

  watch: {
    input: {
      handler (next, prev) {
        if (this.control && next !== prev) {
          this.control.setInput(next)
        }
      },
      immediate: true
    },
    proximity (next, prev) {
      if (this.control && next !== prev) {
        this.control.setProximity(next)
      }
    }
  },

  created () {
    this.control = null
    if (this.accessToken && !this.mapbox.accessToken) {
      this.mapbox.accessToken = this.accessToken
    }
    this.control = new MapboxGeocoder(this.$props)

    this.$_deferredMount()
  },

  methods: {
    $_deferredMount () {
      if (this.container !== null) {
        document
          .getElementById(this.container)
          .appendChild(this.control.onAdd(this.map))
      } else {
        this.map.addControl(this.control, this.position)
      }
      if (this.input) {
        this.control.setInput(this.input)
      }
      this.$_emitEvent('added', { geocoder: this.control })
      this.$_bindSelfEvents(Object.keys(geocoderEvents))
      this.initial = false
    },

    $_bindSelfEvents (events) {
      const vm = this
      Object.keys(this.$listeners).forEach((eventName) => {
        if (events.includes(eventName)) {
          this.control.on(eventName, vm.$_emitControlEvent.bind(vm, eventName))
        }
      })
    },

    $_emitControlEvent (eventName, eventData) {
      return this.$_emitSelfEvent({ type: eventName }, eventData)
    },

    query (query) {
      if (this.control) {
        this.$emit('update:input', query)
        return this.control.query(query)
      }
      return null
    }
  }
}
