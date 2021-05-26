<template>
  <DropDownWithSearchInput
    placeholder="Choose project"
    @onClearSearchInput="onClearProjectNameSearchInput"
    @onOptionSelected="onSelectProject"
    :dropdownOptions="projectOptions"
    :text="selectedProjectName"
    :isReadOnly="initialProject ? initialProject.name !== null : null"
    :isFetching="isLoading"
    :searchEnabled="false"
    :shouldShowEmptyContent="shouldShowErrorView"
  >
    <ErrorMessageView slot="emptyStateView" v-if="!isLoading">
      <span slot="message" v-if="hasNoProject"> 
        No project found.
        <a href="#" class="dropdown-sub-content__link" @click="redirectToArbimon()">Create project in Arbimon</a>
      </span>
      <span slot="message" v-else>
        {{ errorMessage }}
      </span>
      <a href="#" slot="refreshButton" class="dropdown-sub-content__link" @click.prevent="getProjectOptions()">
        <fa-icon class="iconRefresh" :icon="iconRefresh"></fa-icon>
      </a>
    </ErrorMessageView>
  </DropDownWithSearchInput>
</template>

<script>
import DropDownWithSearchInput from '../Common/Dropdown/DropdownWithSearchInput'
import ErrorMessageView from './ErrorMessageView'
import { faSync } from '@fortawesome/free-solid-svg-icons'
import api from '../../../../utils/api'
import settings from 'electron-settings'
import ipcRendererSend from '../../services/ipc'
export default {
  data () {
    return {
      iconRefresh: faSync,
      isLoading: false,
      selectedProjectName: '',
      projectOptions: [],
      errorMessage: ''
    }
  },
  props: {
    initialProject: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  components: { DropDownWithSearchInput, ErrorMessageView },
  computed: {
    shouldShowErrorView () {
      return this.hasNoProject || this.errorMessage !== ''
    },
    hasNoProject () {
      return this.projectOptions.length === 0
    }
  },
  async mounted () {
    if (this.initialProject && this.initialProject.name) this.selectedProjectName = this.initialProject.name
    await this.getProjectOptions()
  },
  methods: {
    async getProjectOptions (keyword = null) {
      if (this.initialProject) return // no need to call api to search, as it's readonly when there is initial project provided
      if (keyword) {
        let selectedProject = this.projectOptions.find(s => s.name === keyword)
        if (selectedProject) return
      }
      console.log('getProjectOptions: start')
      this.isLoading = true
      try {
        const idToken = await ipcRendererSend('getIdToken', `sendIdToken`)
        this.projectOptions = await api.getUserProjects(idToken, keyword)
        this.isLoading = false
        this.errorMessage = ''
      } catch (error) {
        this.isLoading = false
        this.errorMessage = error
      }
    },
    onSelectProject (project) {
      console.log('onSelectProjectName:', project.name)
      this.selectedProjectName = project && project.name ? project.name : ''
    },
    onClearProjectNameSearchInput () {
      console.log('onClearProjectNameSearchInput')
      this.selectedProjectName = ''
    },
    redirectToArbimon () {
      const isProd = settings.get('settings.production_env')
      this.$electron.shell.openExternal(api.arbimonWebUrl(isProd))
    }
  },
  watch: {
    selectedProjectName: {
      handler: async function (value, prevValue) {
        if (value === prevValue || this.initialProject) return // ignore to send event when in readonly mode
        let selectedProject = this.projectOptions.find(s => s.name === value)
        this.$emit('onSelectedProjectNameChanged', selectedProject)
      }
    }
  }
}
</script>
