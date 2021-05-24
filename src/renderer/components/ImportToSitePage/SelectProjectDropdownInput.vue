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
    :shouldShowEmptyContent="shouldShowEmptyStateView"
  >
    <div class="dropdown-sub-content__wrapper" slot="emptyStateView">
      <span> 
        No project found.
        <a href="#" class="dropdown-sub-content__link" @click="redirectToArbimon()">Create project in Arbimon</a>
      </span>
      <fa-icon class="iconRefresh dropdown-sub-content__link" :icon="iconRefresh" @click.prevent="getProjectOptions()" v-if="!isLoading"></fa-icon>
    </div>
  </DropDownWithSearchInput>
</template>

<script>
import DropDownWithSearchInput from '../Common/Dropdown/DropdownWithSearchInput'
import api from '../../../../utils/api'
import { faSync } from '@fortawesome/free-solid-svg-icons'
import settings from 'electron-settings'
import ipcRendererSend from '../../services/ipc'
export default {
  data () {
    return {
      iconRefresh: faSync,
      isLoading: false,
      selectedProjectName: '',
      projectOptions: []
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
  components: { DropDownWithSearchInput },
  computed: {
    shouldShowEmptyStateView () {
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
        // TODO: handle when there is no project
        this.isLoading = false
      } catch (error) {
        this.isLoading = false
        console.log('getProjectOptions error', error, this.projectOptions)
        // TODO: handle error
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
        if (value === prevValue) return
        let selectedProject = this.projectOptions.find(s => s.name === value)
        this.$emit('onSelectedProjectNameChanged', selectedProject)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dropdown-sub-content {
  &__wrapper {
    display: flex;
    justify-content: space-between;
    align-self: center;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  &__link {
    color: $body-text-color;
    font-weight: $title-font-weight;
    cursor: pointer;
  }
  &__link:hover {
    color: $body-text-color;
  }
}
</style>
