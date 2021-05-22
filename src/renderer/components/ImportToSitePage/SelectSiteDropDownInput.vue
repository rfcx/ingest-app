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
    :isDisabled="isDisabled"
  />
</template>

<script>
import DropDownWithSearchInput from '../Common/Dropdown/DropdownWithSearchInput'
import ipcRendererSend from '../../services/ipc'
export default {
  data () {
    return {
      selectedSiteName: '',
      isCreatingNewSite: false,
      siteOptions: null
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
      let queryOpts = { limit: 10, offset: 0, where: {} }
      if (keyword) {
        queryOpts.where.name = { $like: `%${keyword}%` }
      }
      if (this.project && this.project.name) {
        queryOpts.where['project_name'] = this.project.name
      }
      console.log('getSiteOptions', queryOpts, this.project)
      this.siteOptions = await ipcRendererSend('db.streams.getStreamWithStats', `db.streams.getStreamWithStats.${Date.now()}`, queryOpts)
    },
    async onSeachInputTextChanged (text) {
      console.log('onSeachInputTextChanged', text)
      await this.getSiteOptions(text)
      this.selectedSiteName = text
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
        if (value === prevValue) return
        await this.getSiteOptions()
      }
    }
  }
}
</script>
