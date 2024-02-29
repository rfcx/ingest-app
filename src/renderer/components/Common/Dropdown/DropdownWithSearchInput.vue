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
            @blur="onSearchInputBlur"
            @keydown="toggleDropdown(true)" 
            @keyup.enter="toggleDropdown(false)"
            :disabled="isReadOnly || isDisabled" 
            :readonly="!searchEnabled" />
            <span data-clear-input @click="onClearSearchInputFocus" v-if="canEdit">&times;</span>
            <span class="tag is-small is-right" v-if="tagTitle"> {{ tagTitle }} </span>
            <span class="icon is-small is-right" v-if="searchText === ''">
              <fa-icon :icon="icons.arrowDown" aria-hidden="true" @click="hideOnlyDropdownOptions()" />
            </span>
          </div>
        <p class="help" v-if="helpText !== ''" :class="{'is-warning': isWarning}">{{ helpText }}</p>
      </div>
    </div>
    <div class="dropdown-menu" id="dropdown-menu" role="menu" v-if="shouldShowDropDownOptions">
      <div class="dropdown-content" v-if="isFetching">
        <div class="dropdown-item">
          <fa-icon :icon="icons.loading" aria-hidden="true" spin></fa-icon>
        </div>
      </div>
      <div class="dropdown-content" v-else-if="shouldShowEmptyContent">
        <div class="dropdown-item">
          <slot name="emptyStateView"></slot>
        </div>
      </div>
      <div class="dropdown-content" v-else>
        <a href="#" class="dropdown-item" v-for="option in dropdownOptions" 
        :key="option.id" :class="{'is-active': option === selectedOption, 'is-disabled': option.isReadOnly }" 
        @click="onOptionSelected(option)"> 
        <div class="level is-mobile">
          <div class="level-left">
            <span class="level-item">{{ option.name }}</span>
          </div>
        <div class="level-right">
          <span class="icon level-item" v-if="option.isReadOnly">
            <read-only-tag/>
          </span>      
        </div>
        </div>
        </a>
        <hr class="dropdown-divider" v-if="specialOption && dropdownOptions.length > 0">
        <a href="#" class="dropdown-item special-option" v-if="specialOption" @click="onSpecialOptionSelected()">
          {{ specialOption }}
        </a>
      </div>
    </div>
  </div>
</template>
<script>
import { faAngleDown, faCircleNotch, faLock } from '@fortawesome/free-solid-svg-icons'
import ReadOnlyTag from '../Tag/ReadOnlyTag'
export default {
  data () {
    return {
      searchText: this.text,
      isActive: false,
      shouldShowDropDownOptions: true,
      selectedOption: ''
    }
  },
  components: { ReadOnlyTag },
  props: {
    // Input
    text: String,
    placeholder: {
      type: String,
      default: 'Search'
    },
    isReadOnly: {
      type: Boolean,
      default: false
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
    },
    isFetching: {
      type: Boolean,
      default: false
    },
    searchEnabled: {
      type: Boolean,
      default: true
    },
    shouldShowEmptyContent: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    icons: () => ({
      arrowDown: faAngleDown,
      loading: faCircleNotch,
      lock: faLock
    }),
    canEdit () {
      return this.searchText !== '' && !this.isReadOnly && !this.isDisabled
    }
  },
  methods: {
    onSearchInputFocus () {
      this.$emit('onSearchInputFocus')
      this.toggleDropdown(true)
    },
    onSearchInputBlur (e) {
      this.$emit('onSearchInputBlur')
      // hide dropdown when click outside
      const classesInsideDropdown = ['dropdown-item', 'dropdown-sub-content', 'dropdown-sub-content__link']
      if (e.relatedTarget === null || (e.relatedTarget && !classesInsideDropdown.includes(e.relatedTarget.className))) {
        this.toggleDropdown(false)
      }
    },
    onClearSearchInputFocus () {
      this.$emit('onClearSearchInput')
      this.searchText = ''
      if (this.searchEnabled) {
        this.toggleDropdown(true)
      }
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
      if (this.isReadOnly || this.isDisabled) return
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
    },
    text: function (value, prev) {
      if (value === prev) return
      this.searchText = value
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
  .dropdown-item.special-option {
    font-weight: $title-font-weight;
  }

  .dropdown-item.is-disabled {
    pointer-events: none;
    opacity: 0.65;
  }

  .dropdown-item.is-active {
    background-color: $util-gray-03;
  }

  .level {
    width: 100%;
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
</style>
