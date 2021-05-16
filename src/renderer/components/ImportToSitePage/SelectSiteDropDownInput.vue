<template>
  <DropDownWithSearchInput
    placeholder="Search for an existing site"
    @onClearSearchInput="onClearSiteNameSearchInput"
    @onOptionSelected="onSelectExistingSiteName"
    specialOption="Create New Site"
    @onSpecialOptionSelected="onSelectToCreateSite"
    :tagTitle="tagTitle"
  />
</template>

<script>
import DropDownWithSearchInput from '../Common/Dropdown/DropdownWithSearchInput'
export default {
  data () {
    return {
      selectedSiteName: '',
      isCreatingNewSite: false
    }
  },
  components: { DropDownWithSearchInput },
  computed: {
    tagTitle () {
      return this.selectedSiteName ? (this.isCreatingNewSite ? 'New' : 'Existing') : null
    }
  },
  methods: {
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
    selectedSiteName (value) {
      this.$emit('onSelectedSiteNameChanged', value)
    }
  }
}
</script>