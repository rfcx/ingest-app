import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/LandingPage').default
    },
    {
      path: '/add',
      name: 'add-new-stream-page',
      component: require('@/components/AddNewStreamPage').default
    },
    {
      path: '/service',
      name: 'service',
      component: require('@/components/Service').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
