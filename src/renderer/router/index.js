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
      component: require('@/components/CreateStream/CreateStreamPage').default,
      props: (route) => ({ query: route.query })
    },
    {
      path: '/import',
      name: 'import-files',
      component: require('@/components/ImportFiles/ImportFilesPage').default
    },
    {
      path: '/import-to-existing-site',
      name: 'import-to-existing-site',
      component: require('@/components/ImportToExistingSite/ImportToExistingSitePage').default,
      props: (route) => ({ query: route.query })
    },
    {
      path: '/api-service',
      name: 'api-service',
      component: require('@/components/APIService').default
    },
    {
      path: '/about',
      name: 'about-page',
      component: require('@/components/AboutPage').default
    },
    {
      path: '/update',
      name: 'update-page',
      component: require('@/components/UpdatePage').default
    },
    {
      path: '/preferences',
      name: 'preferences-page',
      component: require('@/components/PreferencesPage').default
    },
    {
      path: '/edit-stream-location',
      name: 'edit-stream-location-page',
      component: require('@/components/EditStreamLocation/EditStreamLocationPage').default,
      props: (route) => ({ query: route.query })
    },
    {
      path: '/auth',
      name: 'auth',
      component: require('@/components/AuthPage').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
