<template>
  <DropDownWithSearchInput
    placeholder="Search for an existing site"
    @onSeachInputTextChanged="onSeachInputTextChanged"
    @onClearSearchInput="onClearSiteNameSearchInput"
    @onOptionSelected="onSelectExistingSiteName"
    :dropdownOptions="siteOptions"
    :specialOption="specialOptionTitle"
    @onSpecialOptionSelected="onSelectToCreateSite"
    :tagTitle="tagTitle"
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
  components: { DropDownWithSearchInput },
  computed: {
    tagTitle () {
      return this.selectedSiteName ? (this.isCreatingNewSite ? 'New' : 'Existing') : null
    },
    specialOptionTitle () {
      return this.selectedSiteName && !this.selectedSiteNameHasExactMatchsWithOptions ? `Create New Site: ${this.selectedSiteName}` : null
    },
    selectedSiteNameHasExactMatchsWithOptions () {
      return this.siteOptions.map(s => s.name).includes(this.selectedSiteName)
    }
  },
  async created () {
    await this.getSiteOptions()
  },
  methods: {
    async getSiteOptions (searchText = null) {
      let queryOpts = { limit: 10, offset: 0 }
      if (searchText) {
        queryOpts.where = {
          name: {
            $like: `%${searchText}%`
          }
        }
      }
      console.log('getSiteOptions', queryOpts)
      this.siteOptions = await ipcRendererSend('db.streams.getStreamWithStats', `db.streams.getStreamWithStats.${Date.now()}`, queryOpts)
    },
    async onSeachInputTextChanged (text) {
      console.log('onSeachInputTextChanged', text)
      this.selectedSiteName = text
      await this.getSiteOptions(text)
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
    }
  },
  watch: {
    selectedSiteName: {
      handler: async function (value, prevValue) {
        if (value === prevValue) return
        this.$emit('onSelectedSiteNameChanged', value)
      }
    }
  }
}
</script>