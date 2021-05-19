<template>
  <div class="dropdown" :class="{'is-active': isActive}">
    <div class="dropdown-trigger">
      <div class="field">
          <div class="clearable-input control is-expanded has-icons-right">
            <input 
            type="text" 
            ref="searchInput" 
            v-model="searchText" 
            class="input" 
            :placeholder="placeholder" 
            :class="{'is-warning': isWarning}" 
            @focus="onSearchInputFocus" 
            @keydown="toggleDropdown(true)" 
            @keyup.enter="toggleDropdown(false)"
            :readonly="isReadOnly" />
            <span data-clear-input @click="onClearSearchInputFocus" v-if="canEdit">&times;</span>
            <span class="tag is-small is-right" v-if="tagTitle"> {{ tagTitle }} </span>
            <span class="icon is-small is-right" v-if="searchText === ''">
              <fa-icon :icon="icons.arrowDown" aria-hidden="true" @click="hideOnlyDropdownOptions()" />
            </span>
          </div>
        <p class="help" v-if="helpText !== ''">{{ helpText }}</p>
      </div>
    </div>
    <div class="dropdown-menu" id="dropdown-menu" role="menu" v-if="shouldShowDropDownOptions">
      <div class="dropdown-content">
        <a href="#" class="dropdown-item" v-for="option in dropdownOptions" :key="option.id" :class="{'is-active': option === selectedOption}" @click="onOptionSelected(option)"> {{ option.name }} </a>
        <hr class="dropdown-divider" v-if="specialOption && dropdownOptions.length > 0">
        <a href="#" class="dropdown-item" v-if="specialOption" @click="onSpecialOptionSelected()">
          {{ specialOption }}
        </a>
      </div>
    </div>
  </div>
</template>
<script>
import { faAngleDown, faCross } from '@fortawesome/free-solid-svg-icons'
export default {
  data () {
    return {
      searchText: '',
      isActive: false,
      shouldShowDropDownOptions: true,
      selectedOption: ''
    }
  },
  props: {
    // Input
    placeholder: {
      type: String,
      default: 'Search'
    },
    initialInput: {
      type: String,
      default: ''
    },
    isReadOnly: {
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
          {id: '1', name: 'Option 1'},
          {id: '2', name: 'Option 2'}
        ]
      }
    },
    specialOption: {
      type: String,
      default: ''
    },
    tagTitle: {
      type: String,
      default: ''
    }
  },
  computed: {
    icons: () => ({
      arrowDown: faAngleDown,
      delete: faCross
    }),
    canEdit () {
      return this.searchText !== '' && !this.isReadOnly
    }
  },
  methods: {
    onSearchInputFocus () {
      this.$emit('onSearchInputFocus')
      if (this.isReadOnly) return
      this.toggleDropdown(true)
    },
    onSearchInputBlur (e) {
      this.$emit('onSearchInputBlur')
      if (e.relatedTarget === null) {
        this.toggleDropdown(false)
      }
    },
    onClearSearchInputFocus () {
      this.$emit('onClearSearchInputFocus')
      this.searchText = ''
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
      this.hideOnlyDropdownOptions() // TODO: this might need to be in subclass
    },
    toggleDropdown (show) {
      this.isActive = show
      this.shouldShowDropDownOptions = show
    },
    hideOnlyDropdownOptions () {
      this.$refs.searchInput.focus()
      this.isActive = true
      this.shouldShowDropDownOptions = false
    }
  },
  watch: {
    searchText: function (value, prev) {
      if (value === prev) return
      this.$emit('onSeachInputTextChanged', value)
    }
  },
  created () {
    if (this.initialInput) {
      this.searchText = this.initialInput
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
    height: 32px;
    .control {
      .tag {
        position: absolute;
        top: 6px;
        right: 28px;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
      }
    }
  }
  .clearable-input {
    position: relative;
  }
  .clearable-input > input {
    padding-right: 1.4em;
  }
  .clearable-input > [data-clear-input] {
    position: absolute;
    top: 6px;
    right: 5px;
    font-weight: bold;
    font-size: 1.4em;
    padding: 0 0.2em;
    line-height: 1em;
    cursor: pointer;
  }
  .clearable-input > input::-ms-clear {
    display: none;
  }
  .help {
    color: $secondary-text-color;
  }
</style>