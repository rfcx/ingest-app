<template>
  <div class="dropdown-wrapper">
    <span class="wrapper__title">{{title}}</span>
    <div class="dropdown" :class="{'is-active': show}">
      <div class="dropdown-trigger">
        <button class="button" :class="{'is-loading': isLoading, 'focus': isFocus}" aria-haspopup="true" aria-controls="dropdown-menu" @click="onClick" v-click-outside="onClickOutside">
          <span>{{ selectedOptionText }}</span>
          <span class="icon is-small">
            <fa-icon :icon="icons.arrowDown" aria-hidden="true" />
          </span>
        </button>
      </div>
      <div class="dropdown-menu" id="dropdown-menu" role="menu">
        <div class="dropdown-content">
          <a href="#" class="dropdown-item"
            v-for="option in options"
            :key="option"
            :class="{'is-active': isSelectedOption(option, selectedOptionText)}"
            @click="onSelectOption(option)">
            {{ option }}
          </a>
          <hr class="dropdown-divider" v-if="specialOptionTitle">
          <a href="#" class="dropdown-item" @click="onSelectSpecialOption" v-if="specialOptionTitle">
            {{specialOptionTitle}}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
export default {
  data () {
    return {
      show: false
    }
  },
  props: {
    title: String,
    isLoading: false,
    selectedOptionText: '',
    options: Array,
    specialOptionTitle: null,
    isFocus: false
  },
  computed: {
    icons: () => ({
      arrowDown: faAngleDown
    })
  },
  methods: {
    isSelectedOption (option, selectedOptionText) {
      return selectedOptionText.includes(option)
    },
    onClick () {
      this.show = !this.show
      this.$emit('onClick')
    },
    onClickOutside () {
      this.$emit('onClickOutside')
      this.show = false
    },
    onSelectOption (option) {
      this.$emit('onSelectOption', option)
      this.show = false
    },
    onSelectSpecialOption () {
      this.$emit('onSelectSpecialOption')
      this.show = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    &__title {
      font-weight: $title-font-weight;
      color: $secondary-text-color;
      display: block;
    }
  }
  .dropdown {
    margin-top: 4px;
  }

  .dropdown-trigger .button.focus {
    border-color: $warning-text-color;
  }
  .dropdown-trigger > .button {
    color: $brand-primary !important;
    background-color: transparent !important;
    font-weight: 500 !important;
    border-color: $brand-primary !important;
  }
</style>
