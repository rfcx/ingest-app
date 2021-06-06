<template>
  <DropDownWithSearchInput
    placeholder="Search for an existing site"
    @onSearchInputFocus="onSearchInputFocus"
    @onSeachInputTextChanged="onSeachInputTextChanged"
    @onClearSearchInput="onClearSiteNameSearchInput"
    @onSearchInputBlur="onBlurSiteNameSearchInput"
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
    :shouldShowEmptyContent="shouldShowErrorView"
  >
  <ErrorMessageView slot="emptyStateView" v-if="!isLoading">
      <span slot="message">
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
      console.log('selectedSiteNameHasExactMatchsWithOptions', this.siteOptions)
      if (this.initialSite) return true
      if (!this.siteOptions || this.siteOptions.length === 0) return false
      return this.siteOptions.map(s => s.name).includes(this.selectedSiteName)
    },
    isDisabled () {
      // no project and no default site selected
      const noProjectSelected = !this.project || (this.project && Object.keys(this.project).length === 0)
      return noProjectSelected && !this.initialSite
    },
    shouldShowErrorView () {
      return this.errorMessage !== ''
    }
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
        this.errorMessage = ''
        this.isLoading = false
      } catch (error) {
        console.log('getSiteOptions error', error)
        this.isLoading = false
        this.errorMessage = error
      }
    },
    async onSearchInputFocus () {
      await this.getSiteOptions()
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

      console.log('onSeachInputTextChanged prepare to update is create', this.selectedSiteNameHasExactMatchsWithOptions)
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
      this.updateTagTitle()
    },
    onSelectToCreateSite () {
      console.log('onSelectToCreateSite')
      this.updateIsCreatingNewSite(true)
      this.updateTagTitle()
    },
    onClearSiteNameSearchInput () {
      console.log('onClearSiteNameSearchInput')
      this.selectedSiteName = ''
      this.updateTagTitle()
    },
    onBlurSiteNameSearchInput () {
      this.updateTagTitle()
    },
    updateIsCreatingNewSite (isCreating) {
      console.log('updateIsCreatingNewSite', isCreating)
      this.isCreatingNewSite = isCreating
      this.$emit('update:updateIsCreatingNewSite', this.isCreatingNewSite)
    },
    resetSelectedSite () {
      this.selectedSiteName = ''
    },
    updateTagTitle () {
      const isCreatingNewAndAlreadyInputSomeText = this.selectedSiteName && this.isCreatingNewSite
      const hasDefaultSiteSelectedAndInReadOnlyMode = this.initialSite !== null
      this.tagTitle = isCreatingNewAndAlreadyInputSomeText && !hasDefaultSiteSelectedAndInReadOnlyMode ? 'New' : null
    }
  },
  watch: {
    initialSite () {
      if (this.initialSite && this.initialSite.name) this.selectedSiteName = this.initialSite.name
    },
    selectedSiteName: {
      handler: async function (value, prevValue) {
        if (value === prevValue || this.initialSite) return // ignore to send event when in readonly mode
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
