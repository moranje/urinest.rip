<script lang="ts" setup>
  useHead({
    titleTemplate: 'Over - urinest.rip',
  });
</script>

<template>
  <div class="vff vff-not-standalone">
    <div class="f-container">
      <ContentDoc />
    </div>
  </div>
</template>

<style>
  .about-text {
    width: calc(100% - 120px);
    float: left;
  }

  /* .side-column {
    width: 120px;
  } */

  .side-column img.about-image {
    border-radius: 50%;
    margin-bottom: 0;
    width: 100px;
    height: 100px;
  }

  .side-column img.about-image:hover {
    filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.5));
  }

  p.about-name {
    clear: left;
    overflow: auto;
    font-style: italic;
    font-weight: 400;
    text-transform: uppercase;
    padding-top: 12px;
  }

  @media screen and (min-width: 1024px) {
    header.navbar {
      /* padding: 6px 13.5%; */
    }
  }

  @media screen and (min-width: 1366px) {
    header.navbar {
      /* padding: 6px 18%; */
    }
  }
</style>
