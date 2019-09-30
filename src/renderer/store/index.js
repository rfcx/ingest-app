import Vue from 'vue'
import Vuex from 'vuex'
import VuexORM from '@vuex-orm/core'
import Stream from './models/Stream'
import File from './models/File'
import State from './models/State'

import { createPersistedState, createSharedMutations } from 'vuex-electron'

import modules from './modules'

Vue.use(Vuex)

// Create a new database instance.
const database = new VuexORM.Database()

// Register Models to the database.
database.register(Stream)
database.register(File)
database.register(State)

export default new Vuex.Store({
  modules,
  plugins: [
    VuexORM.install(database),
    createPersistedState(),
    createSharedMutations()
  ],
  strict: process.env.NODE_ENV !== 'production'
})
