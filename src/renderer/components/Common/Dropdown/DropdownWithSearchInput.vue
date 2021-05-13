<template>
  <div class="dropdown" :class="{'is-active': isActive}">
    <div class="dropdown-trigger">
      <div class="field field-stream-name">
        <p class="control is-expanded has-icons-right">
          <input v-model="searchText" class="input" type="search" :placeholder="placeholder" :class="{'is-warning': isWarning}" @focus="onSearchInputFocus" :disabled="isDisabled"/>
          <span class="icon is-small is-right"><fa-icon :icon="icons.arrowDown" aria-hidden="true" /></span>
        </p>
        <p class="help" v-if="helpText !== ''">{{ helpText }}</p>
      </div>
    </div>
    <div class="dropdown-menu" id="dropdown-menu" role="menu">
      <div class="dropdown-content">
        <a href="#" class="dropdown-item" v-for="option in dropdownOptions" :key="option.id" :class="{'is-active': option === selectedOption}" @click="onOptionSelected(option)"> {{ option.name }} </a>
        <hr class="dropdown-divider" v-if="specialOption">
        <a href="#" class="dropdown-item" v-if="specialOption" @click="onSpecialOptionSelected()">
          {{ specialOption }}
        </a>
      </div>
    </div>
  </div>
</template>
<script>
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
export default {
  data () {
    return {
      searchText: '',
      isActive: false,
      selectedOption: ''
    }
  },
  props: {
    // Input
    placeholder: {
      type: String,
      default: 'Search'
    },
    isDisabled: {
      type: Boolean,
      default: false
    },
    isWarning: {
      type: Boolean,
      default: false
    },
    helpText: {
      type: String,
      default: ''
    },
    // Dropdown
    dropdownOptions: {
      type: Array,
      default: () => {
        return [
          {id: 'aaa', name: 'Aaa'},
          {id: 'bbb', name: 'Bbb'}
        ]
      }
    },
    specialOption: {
      type: String,
      default: ''
    }
  },
  computed: {
    icons: () => ({
      arrowDown: faAngleDown
    })
  },
  methods: {
    onSearchInputFocus () {
      this.$emit('onSearchInputFocus')
      this.toggleDropdown(true)
    },
    onOptionSelected (option) {
      this.$emit('onOptionSelected', option)
      this.searchText = option.name
      this.selectedOption = option
      this.toggleDropdown(false)
    },
    onSpecialOptionSelected (option) {
      this.$emit('onSpecialOptionSelected', option)
      this.toggleDropdown(false)
    },
    toggleDropdown (show) {
      this.isActive = show
    }
  },
  watch: {
    searchText: function (value) {
      console.log(value)
      if (value === '') {
        this.$emit('onClearSearchInput')
        this.toggleDropdown(true)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .dropdown,
  .dropdown-trigger,
  .dropdown-menu {
    width: 100%;
  }
  .dropdown-trigger {
    height: 40px;
  }
</style>