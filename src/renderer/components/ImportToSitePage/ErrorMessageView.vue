<template>
  <div class="dropdown-sub-content__wrapper">
      <slot name="message"></slot>
      <slot name="refreshButton"></slot>
    </div>
</template>

<style lang="scss" scoped>
.dropdown-sub-content {
  &__wrapper {
    display: flex;
    justify-content: space-between;
    align-self: center;
    text-overflow: ellipsis;
  }
  &__link {
    color: $body-text-color;
    font-weight: $title-font-weight;
    cursor: pointer;
  }
  &__link:hover {
    color: $body-text-color;
  }
}
</style>
