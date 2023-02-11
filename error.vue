<script lang="ts" setup>
  const props = withDefaults(
    defineProps<{
      error: object | null;
    }>(),
    {
      error: null,
    }
  );
  const router = useRouter();
</script>

<template>
  <div class="error-page">
    <div class="error">
      <span class="head">404</span>

      <div class="title">Dat. Bestaat. Niet.</div>

      <button type="button" @click="router.push({ path: '/' })" class="button">
        Naar huis
      </button>

      <!-- <span class="log">
        {{ JSON.stringify(props.error) }}
      </span> -->
    </div>
  </div>
</template>

<style lang="scss" local>
  .error-page {
    padding: 1rem;
    background: var(--vff-bg-color);
    color: var(--vff-main-text-color);
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font-weight: 100 !important;
    -ms-text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    .head {
      font-size: 10rem;
    }

    button.button {
      font-family: inherit;
      font-size: 100%;
      line-height: 1.15;
      margin: 0;
      border: none;
      outline: 0;
      cursor: pointer;
      padding: 0.6em 1.4em;
      text-align: center;
      display: inline-block;
      min-height: 44px;
      white-space: pre-wrap;
      max-width: 100%;
      -webkit-appearance: none;
      overflow: visible;
      color: var(--vff-button-text-color);
      background-color: var(--vff-button-color);
      border-radius: var(--vff-border-radius);

      &:hover,
      &:focus {
        background-color: var(--vff-button-hover-color);
        opacity: 0.9;
        border-radius: var(--vff-border-radius);
      }
    }
  }
  .error-page .error {
    max-width: 450px;
  }
  .error-page .title {
    font-size: 1.5rem;
    margin-top: 1rem;
    color: var(--vff-main-text-color);
    margin-bottom: 1.5rem;
  }

  .error-page .log {
    position: absolute;
    bottom: 12px;
    left: 0;
    text-align: center;
    width: 100%;
  }
</style>
