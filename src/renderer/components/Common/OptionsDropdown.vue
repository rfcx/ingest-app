<template>
  <div class="dropdown-wrapper">
    <div class="wrapper__title" style="display:flex">
      <span>{{title}}</span>
      <img v-if="title === 'Timezone source'" src="~@/assets/ic-info.svg" class="popover-trigger" @click="togglePopover('info-popover')">
      <div v-if="title === 'Timezone source'" id="info-popover" class="popover is-popover-top is-not-popover-hover">
        <div class="popover-content">
          Learn more
          <a href="https://help.arbimon.org/article/179-using-the-arbimon-uploader-app" class="link" target="_blank">here</a>
        </div>
      </div>
    </div>
    <div class="dropdown" :class="{'is-active': show}" style="display:block">
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
            :class="{'is-active': isSelectedOption(option, selectedOptionText), 'is-disabled': isDisableOption(option, selectedOptionText) }"
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
    isDisableOption (option, selectedOptionText) {
      if (selectedOptionText.includes('Ignore file, use site timezone')) {
        return false
      } else {
        return !selectedOptionText.includes(option)
      }
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
    },
    togglePopover (elementId) {
      const el = document.getElementById(elementId)
      if (el) {
        el.classList.toggle('is-popover-active')
      }
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
      align-items: center;
      img {
        height: 1.25em;
        margin-left: 5px;
        cursor: pointer;
      }
      span {
        margin-left: 0.25em;
      }
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
  .dropdown-item.is-disabled {
    pointer-events: none;
    opacity: 0.65;
  }
  .popover {
    position: relative;
    display: inline-block;
  }
  .popover .popover-content {
    z-index: 99999;
    position: absolute;
    display: inline-block;
    opacity: 0;
    visibility: hidden;
    font-size: 0.75rem;
    padding: .8rem 1.2rem;
    color: $insight;
    background-color: $moss;
    border-radius: 6px;
    box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);
    width: -webkit-max-content;
    width: -moz-max-content;
    width: max-content;
    max-width: 24rem;
  }

  .popover .popover-content .link {
    color: #ADFF2C
  }

  .popover .popover-content::before {
    position: absolute;
    content: '';
    border-style: solid;
    pointer-events: none;
    height: 0;
    width: 0;
    top: 100%;
    left: 50%;
    border-color: transparent;
    border-bottom-color: $moss;
    border-left-color: $moss;
    border-width: 0.4rem;
    margin-left: -0.4rem;
    margin-top: -0.4rem;
    transform-origin: center;
    box-shadow: -1px 1px 2px rgba(10, 10, 10, 0.2);
  }

  .popover:hover .popover-content {
    opacity: 1;
    visibility: visible;
  }

  .popover:hover.is-not-popover-hover .popover-content {
    opacity: 0;
    visibility: hidden;
  }

  .popover .popover-trigger:focus ~ .popover-content {
    opacity: 1;
    visibility: visible;
  }

  .popover.is-popover-active .popover-content {
    opacity: 1 !important;
    visibility: visible !important;
  }

  .popover .popover-content {
    top: auto !important;
    bottom: 100% !important;
    left: 50% !important;
    right: auto !important;
    transform: translate(-50%, -0.7rem) !important;
  }

  .popover .popover-content::before {
    top: 100% !important;
    bottom: auto !important;
    left: 50% !important;
    right: auto !important;
    transform: rotate(-45deg);
  }

  .popover.is-popover-top .popover-content {
    top: auto !important;
    bottom: 100% !important;
    left: 50% !important;
    right: auto !important;
    transform: translate(-50%, -0.7rem) !important;
  }

  .popover.is-popover-top .popover-content::before {
    top: 100% !important;
    bottom: auto !important;
    left: 50% !important;
    right: auto !important;
    transform: rotate(-45deg);
  }
</style>
