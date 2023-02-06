<script lang="ts" setup></script>

<template>
  <header class="navbar vff-header">
    <div class="f-container flex justify-between">
      <logo v-if="$route.name === 'index'" @click="$router.go(0)" />
      <logo v-else @click="$router.push('/')" />
      <img
        @click="navigateTo('/over')"
        src="../assets/user-image.jpeg"
        alt="Martien Oranje"
        class="navbar-item about"
      />
    </div>
  </header>
</template>

<style lang="scss" scoped>
  header.navbar {
    background-color: var(--vff-bg-color);
    border-bottom: 2px solid var(--vff-main-accent-color);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .f-container {
    justify-content: space-between;
    display: flex;
  }

  header.navbar .navbar-item:hover {
    // border: 2px solid var(--vff-main-accent-color);
    cursor: pointer;
  }

  .navbar-item.about {
    border-radius: 9999px;
    width: 3rem;
    height: 3rem;

    &:hover {
      filter: brightness(0.75);
    }
  }

  @media screen and (min-width: 1366px) {
    header.navbar {
      padding: 8px 10% 4px 10%;
    }
  }
</style>
