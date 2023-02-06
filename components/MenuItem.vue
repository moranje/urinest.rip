<script lang="ts" setup>
  const props = withDefaults(
    defineProps<{
      name: string;
      to?: string;
    }>(),
    {
      name: '',
    }
  );
  const router = useRouter();

  let name = ref(props.name);
  let to = ref(props.to);
  let hover = ref(false);
  let touch = ref(false);

  function tap() {
    touch.value = true;
    if (to.value) router.push({ path: to.value });
  }
</script>

<template>
  <div
    :class="{ 'menu-item': true, hover, touch }"
    @click="to ? router.push({ path: to }) : ''"
    @mouseover="hover = true"
    @mouseleave="hover = false"
    @touchstart.prevent="tap"
    @touchend.prevent="touch = false"
  >
    <div class="menu-image">
      <slot :hover="hover" :touch="touch"></slot>
    </div>
    <div :class="{ 'menu-text': true, hover, touch }">
      {{ name }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .menu-item {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    border-bottom-color: transparent;
    border-bottom-width: 2px;

    &.hover {
      background-color: var(--vff-main-form-bg-color);
      border-bottom-color: var(--vff-main-accent-color);
    }

    .menu-image {
      flex-grow: 4;
      height: 100%;

      display: flex;
      justify-content: center;
      align-items: center;
    }

    .menu-text {
      flex-grow: 1;
      text-transform: uppercase;
      text-align: center;
      font-size: 1.5em;

      &.hover {
        color: var(--vff-main-accent-color);
      }
    }
  }

  @media (hover: none) {
    .menu-item {
      user-select: none;
      background-color: var(--vff-main-form-bg-color);

      &.touch {
        border-bottom-color: var(--vff-main-accent-color);
      }

      .menu-text {
        &.touch {
          color: var(--vff-main-accent-color);
        }
      }
    }
  }
</style>
