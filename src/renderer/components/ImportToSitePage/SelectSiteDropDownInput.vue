<template>
  <DropDownWithSearchInput
    placeholder="Search for an existing site"
    @onSeachInputTextChanged="onSeachInputTextChanged"
    @onClearSearchInput="onClearSiteNameSearchInput"
    @onOptionSelected="onSelectExistingSiteName"
    :text="selectedSiteName"
    :isReadOnly="initialSite ? initialSite.name !== null : null"
    :dropdownOptions="siteOptions"
    :specialOption="specialOptionTitle"
    @onSpecialOptionSelected="onSelectToCreateSite"
    :tagTitle="tagTitle"
    :isWarning="isWarning"
    :helpText="helpText"
    :isFetching="isLoading"
    :isDisabled="isDisabled"
  />
</template>

<script>
import DropDownWithSearchInput from '../Common/Dropdown/DropdownWithSearchInput'
import api from '../../../../utils/api'
import ipcRendererSend from '../../services/ipc'
export default {
  data () {
    return {
      selectedSiteName: '',
      isCreatingNewSite: false,
      siteOptions: null,
      isLoading: false,
      searchTimer: null
    }
  },
  props: {
    isWarning: {
      type: Boolean,
      default: false
    },
    initialSite: {
      type: Object,
      default: () => {
        return {}
      }
    },
    helpText: {
      type: String,
      default: ''
    },
    project: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  components: { DropDownWithSearchInput },
  computed: {
    tagTitle () {
      const isCreatingNewAndAlreadyInputSomeText = this.selectedSiteName && this.isCreatingNewSite
      const hasDefaultSiteSelectedAndInReadOnlyMode = this.initialSite !== null
      return isCreatingNewAndAlreadyInputSomeText && !hasDefaultSiteSelectedAndInReadOnlyMode ? 'New' : null
    },
    specialOptionTitle () {
      return this.selectedSiteName && !this.selectedSiteNameHasExactMatchsWithOptions ? `Create New Site: ${this.selectedSiteName}` : null
    },
    selectedSiteNameHasExactMatchsWithOptions () {
      return this.siteOptions.map(s => s.name).includes(this.selectedSiteName)
    },
    isDisabled () {
      // no project and no default site selected
      const noProjectSelected = !this.project || (this.project && Object.keys(this.project).length === 0)
      return noProjectSelected && !this.initialSite
    }
  },
  async created () {
    if (this.initialSite && this.initialSite.name) this.selectedSiteName = this.initialSite.name
    await this.getSiteOptions()
  },
  methods: {
    async getSiteOptions (keyword = null) {
      if (this.initialSite) return // no need to call api to search, as it's readonly when there is initial project provided
      if (keyword) {
        let selectedSite = this.siteOptions.find(s => s.name === keyword)
        if (selectedSite) return
      }
      this.isLoading = true
      try {
        const idToken = await ipcRendererSend('getIdToken', `sendIdToken`)
        this.siteOptions = await api.getUserSites(idToken, keyword, this.project ? this.project.id : null, 10, 0)
        console.log('getSiteOptions', keyword, this.project.id, this.siteOptions.length)
        this.isLoading = false
      } catch (error) {
        console.log('getSiteOptions error', error)
        this.isLoading = false
      }
    },
    async onSeachInputTextChanged (text) {
      console.log('onSeachInputTextChanged', text)
      this.selectedSiteName = text
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
        this.searchTimer = null
      }
      this.searchTimer = setTimeout(async () => {
        await this.getSiteOptions(this.selectedSiteName)
      }, 300) // debounce, wait 300 mil sec for user to type, then call api to get data

      if (this.selectedSiteNameHasExactMatchsWithOptions) {
        this.updateIsCreatingNewSite(false) // use exact matchs
      } else {
        this.updateIsCreatingNewSite(true)
      }
    },
    onSelectExistingSiteName (site) {
      console.log('onSelectSiteName:', site.name)
      this.selectedSiteName = site.name
      this.updateIsCreatingNewSite(false)
    },
    onSelectToCreateSite () {
      console.log('onSelectToCreateSite')
      this.updateIsCreatingNewSite(true)
    },
    onClearSiteNameSearchInput () {
      console.log('onClearSiteNameSearchInput')
      this.selectedSiteName = ''
    },
    updateIsCreatingNewSite (isCreating) {
      this.isCreatingNewSite = isCreating
      this.$emit('update:updateIsCreatingNewSite', this.isCreatingNewSite)
    },
    resetSelectedSite () {
      console.log('resetSelectedSite')
      this.selectedSiteName = ''
    }
  },
  watch: {
    selectedSiteName: {
      handler: async function (value, prevValue) {
        if (value === prevValue) return
        let selectedSite = this.siteOptions.find(s => s.name === value) || { name: value }
        this.$emit('onSelectedSiteNameChanged', selectedSite)
      }
    },
    project: {
      handler: async function (value, prevValue) {
        console.log('watch: project', value)
        if (value === prevValue) return
        await this.getSiteOptions()
      }
    }
  }
}
</script>
