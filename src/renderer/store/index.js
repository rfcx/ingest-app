import Vue from 'vue'
import Vuex from 'vuex'
import VuexORM from '@vuex-orm/core'
import Stream from './models/Stream'
import streamAdditions from './models/stream-additions'
import File from './models/File'
import modules from './modules'
import { createPersistedState, createSharedMutations } from 'vuex-electron'

Vue.use(Vuex)

// Create a new database instance.
const database = new VuexORM.Database()

// Register Models to the database.
database.register(Stream, streamAdditions)
database.register(File)

export default new Vuex.Store({
  modules,
  plugins: [
    VuexORM.install(database),
    createPersistedState(),
    createSharedMutations()
  ],
  strict: process.env.NODE_ENV !== 'production'
})
