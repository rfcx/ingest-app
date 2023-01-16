<template>
  <DropDownWithSearchInput
    placeholder="Search for an existing site"
    @onSearchInputFocus="onSearchInputFocus"
    @onSeachInputTextChanged="onSeachInputTextChanged"
    @onClearSearchInput="onClearSiteNameSearchInput"
    @onSearchInputBlur="onBlurSiteNameSearchInput"
    @onOptionSelected="onSelectExistingSiteName"
    :text="selectedSiteName"
    :dropdownOptions="siteOptions"
    :specialOption="specialOptionTitle"
    @onSpecialOptionSelected="onSelectToCreateSite"
    :tagTitle="tagTitle"
    :isWarning="isWarning"
    :helpText="helpText"
    :isFetching="isLoading"
    :isDisabled="isDisabled"
    :shouldShowEmptyContent="shouldShowErrorView"
  >
  <ErrorMessageView slot="emptyStateView" v-if="!isLoading">
    <span slot="message" v-if="hasNoSite"> 
        No site in this project. Start typing site name to create one.
      </span>
      <span slot="message" v-else>
        {{ errorMessage }}
      </span>
      <a href="#" slot="refreshButton" class="dropdown-sub-content__link" @click.prevent="getSiteOptions()">
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
import ipcRendererSend from '../../services/ipc'
export default {
  data () {
    return {
      selectedSite: this.initialSite,
      selectedSiteName: '',
      isCreatingNewSite: false,
      siteOptions: [],
      isLoading: false,
      searchTimer: null,
      iconRefresh: faSync,
      errorMessage: '',
      tagTitle: ''
    }
  },
  props: {
    isWarning: {
      type: Boolean,
      default: false
    },
    disabled: {
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
  components: { DropDownWithSearchInput, ErrorMessageView },
  computed: {
    specialOptionTitle () {
      return this.selectedSiteName && !this.selectedSiteNameHasExactMatchsWithOptions ? `Create New Site: ${this.selectedSiteName}` : null
    },
    selectedSiteNameHasExactMatchsWithOptions () {
      return this.siteOptions.filter(s => s.name === this.selectedSiteName).length === 1 // only 1 that exact matchs
    },
    isDisabled () {
      // no project and no default site selected
      const noProjectSelected = !this.project || (this.project && Object.keys(this.project).length === 0)
      return noProjectSelected || this.disabled
    },
    shouldShowErrorView () {
      return this.errorMessage !== '' || (this.hasNoSite && this.selectedSiteName === '')
    },
    hasNoSite () {
      return this.siteOptions.length === 0
    }
  },
  created () {
    this.updateSelectedSite(this.initialSite)
  },
  methods: {
    async getSiteOptions (keyword = null) {
      if (keyword) {
        let selectedSite = this.siteOptions.find(s => s.name === keyword)
        if (selectedSite) return
      }
      this.isLoading = true
      try {
        const idToken = await ipcRendererSend('getIdToken', `sendIdToken`)
        this.siteOptions = await api.getUserSites(idToken, keyword, this.project ? this.project.id : null, 100, 0)
        this.errorMessage = ''
        this.isLoading = false
      } catch (error) {
        console.error('[Select Site DropDown] getSiteOptions error', error)
        this.isLoading = false
        this.errorMessage = error
      }
    },
    async onSearchInputFocus () {
      await this.getSiteOptions()
    },
    async onSeachInputTextChanged (text) {
      if (this.selectedSite && this.selectedSite.name === text) { return }
      this.selectedSiteName = text

      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
        this.searchTimer = null
      }
      this.searchTimer = setTimeout(async () => {
        await this.getSiteOptions(this.selectedSiteName)
      }, 300) // debounce, wait 300 mil sec for user to type, then call api to get data

      const hasTypingKeywordThatExacyMatchWithExistingSite = this.selectedSiteNameHasExactMatchsWithOptions
      const hasChosenPreselectedSite = this.initialSite && (this.initialSite.name === this.selectedSiteName)
      if (hasChosenPreselectedSite) {
        this.updateSelectedSite(this.initialSite)
      } else if (hasTypingKeywordThatExacyMatchWithExistingSite) {
        let site = this.getSiteFromSiteList(this.selectedSiteName)
        this.updateSelectedSite(site)
      } else {
        this.updateSelectedSite({name: text})
      }
    },
    onSelectExistingSiteName (site) {
      this.updateSelectedSite(site)
    },
    onSelectToCreateSite () {
      this.updateIsCreatingNewSite(true)
      this.updateTagTitle()
    },
    onClearSiteNameSearchInput () {
      this.updateSelectedSite(null)
    },
    onBlurSiteNameSearchInput () {
      this.updateTagTitle()
    },
    updateIsCreatingNewSite (isCreating) {
      this.isCreatingNewSite = isCreating
      this.$emit('update:updateIsCreatingNewSite', this.isCreatingNewSite)
    },
    resetSelectedSite () {
      this.updateSelectedSite(null)
    },
    updateTagTitle () {
      const isCreatingNewAndAlreadyInputSomeText = this.selectedSiteName && this.isCreatingNewSite
      this.tagTitle = isCreatingNewAndAlreadyInputSomeText ? 'New' : null
    },
    /** get matching site from site list by name and id */
    getSiteFromSiteList (name, id = null) {
      return this.siteOptions.find(site => site.name === name && (id ? site.id === id : true))
    },
    updateSelectedSite (site) {
      // consider if it is a valid site / potentially a new site
      const newSite = site || {name: ''}
      const isExistingSite = site && site.id
      // assign value to selected site & site name
      this.selectedSiteName = newSite.name
      if (newSite === this.selectedSite) return
      this.selectedSite = newSite
      // update other conditions
      this.updateIsCreatingNewSite(!isExistingSite) // to update the import / create button
      this.updateTagTitle() // to show 'New' tag on a new site
      this.$emit('onSelectedSiteNameChanged', this.selectedSite)
    }
  },
  watch: {
    initialSite () {
      this.updateSelectedSite(this.initialSite)
    }
  }
}
</script>
