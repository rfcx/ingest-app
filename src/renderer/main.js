import Vue from 'vue'
import axios from 'axios'
import 'bulma/css/bulma.css'

import App from './App'
import router from './router'
import store from './store'
import file from './services/file'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronUp, faChevronDown, faPencilAlt, faRedo } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faChevronUp, faChevronDown, faPencilAlt, faRedo)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.directive('click-outside', {
  bind: function (el, binding, vNode) {
    // Provided expression must evaluate to a function.
    if (typeof binding.value !== 'function') {
      const compName = vNode.context.name
      let warn = `[Vue-click-outside:] provided expression '${binding.expression}' is not a function, but has to be`
      if (compName) { warn += `Found in component '${compName}'` }
      console.warn(warn)
    }
    // Define Handler and cache it on the element.
    const bubble = binding.modifiers.bubble
    const hand = (e) => {
      if (bubble || (!el.contains(e.target) && el !== e.target)) {
        binding.value(e)
      }
    }
    el.__vueClickOutside__ = hand
    // add Event Listeners.
    document.addEventListener('click', hand)
  },
  unbind: function (el, binding) {
    // Remove Event Listeners.
    document.removeEventListener('click', el.__vueClickOutside__)
    el.__vueClickOutside__ = null
  }
})

Vue.$file = file

Object.defineProperty(Vue.prototype, '$file', {
  get () {
    return file
  }
})

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  file,
  template: '<App/>'
}).$mount('#app')
