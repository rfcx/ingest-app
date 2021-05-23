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
  />
</template>

<script>
import DropDownWithSearchInput from '../Common/Dropdown/DropdownWithSearchInput'
import api from '../../../../utils/api'
import ipcRendererSend from '../../services/ipc'
export default {
  data () {
    return {
      isLoading: false,
      selectedProjectName: '',
      projectOptions: null
    }
  },
  props: {
    isWarning: {
      type: Boolean,
      default: false
    },
    initialProject: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  components: { DropDownWithSearchInput },
  async mounted () {
    await this.getProjectOptions()
  },
  methods: {
    async getProjectOptions (keyword = null) {
      if (this.initialProject) return // no need to call api to search, as it's readonly when there is initial project provided
      if (keyword) {
        let selectedProject = this.projectOptions.find(s => s.name === keyword)
        if (selectedProject) return
      }
      this.isLoading = true
      try {
        const idToken = await ipcRendererSend('getIdToken', `sendIdToken`)
        this.projectOptions = await api.getUserProjects(idToken, keyword)
        // TODO: handle when there is no project
        this.isLoading = false
      } catch (error) {
        this.isLoading = false
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
