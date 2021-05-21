<template>
  <DropDownWithSearchInput
    placeholder="Choose project"
    @onSeachInputTextChanged="onSeachInputTextChanged"
    @onClearSearchInput="onClearSiteNameSearchInput"
    @onOptionSelected="onSelectProject"
    :dropdownOptions="projectOptions"
    :initialInput="initialProject ? initialProject.name : null"
    :isReadOnly="initialProject ? initialProject.name !== null : null"
    :isFetching="isLoading"
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
      projectOptions: null,
      searchTimer: null
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
        console.log('getProjectOptions', keyword, this.projectOptions)
        this.isLoading = false
      } catch (error) {
        console.log('getProjectOptions error', error)
        this.isLoading = false
      }
    },
    async onSeachInputTextChanged (text) {
      console.log('onSeachInputTextChanged', text)
      this.selectedProjectName = text
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
        this.searchTimer = null
      }
      this.searchTimer = setTimeout(() => {
        this.getProjectOptions(this.selectedProjectName)
      }, 1000) // wait 1 sec for user to type, then call api to get data
    },
    onSelectProject (project) {
      console.log('onSelectSiteName:', project.name)
      this.selectedProjectName = project.name
    },
    onClearSiteNameSearchInput () {
      console.log('onClearSiteNameSearchInput')
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
    },
    projectOptions (val) {
      console.log('watch: projectOptions', val)
    }
  }
}
</script>
