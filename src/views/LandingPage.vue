<template>
  <div class="landing-page">
    <div class="landing-content">
      <h1 class="sr-only">Beslishulp urineonderzoek — kies een test</h1>
      <div class="grid stagger-children">
        <MenuItem
          v-slot="{ hover, touch }"
          to="/questionnaire/gezonde-vrouwen"
          name="Gezonde vrouwen"
        >
          <HealthySvg :hover="hover" :touch="touch" />
        </MenuItem>
        <MenuItem v-slot="{ hover, touch }" to="/questionnaire/strip" name="Urinestrip">
          <StripSvg :hover="hover" :touch="touch" />
        </MenuItem>
        <MenuItem v-slot="{ hover, touch }" to="/questionnaire/dipslide" name="Dipslide">
          <DipslideSvg :hover="hover" :touch="touch" />
        </MenuItem>
        <MenuItem v-slot="{ hover, touch }" to="/questionnaire/sediment" name="Sediment">
          <SedimentSvg :hover="hover" :touch="touch" />
        </MenuItem>
        <MenuItem v-slot="{ hover, touch }" to="/questionnaire/kweek" name="Kweek">
          <CultureSvg :hover="hover" :touch="touch" />
        </MenuItem>
      </div>

      <section class="uti-section stagger-children">
        <h3 class="uti-heading">Urineweginfecties</h3>
        <div class="uti-grid">
          <router-link to="/questionnaire/bacteriurie" class="uti-tile">
            <span class="uti-tile-title">Bacteriurie</span>
            <span class="uti-tile-desc">Diagnose &amp; behandeling</span>
          </router-link>
          <router-link to="/questionnaire/leukocyturie" class="uti-tile">
            <span class="uti-tile-title">Leukocyturie</span>
            <span class="uti-tile-desc">Geïsoleerde leukocyturie</span>
          </router-link>
          <router-link to="/questionnaire/hematurie" class="uti-tile">
            <span class="uti-tile-title">Hematurie</span>
            <span class="uti-tile-desc">Beoordeling hematurie</span>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import MenuItem from "../components/MenuItem.vue";
import HealthySvg from "../components/HealthySvg.vue";
import StripSvg from "../components/StripSvg.vue";
import DipslideSvg from "../components/DipslideSvg.vue";
import SedimentSvg from "../components/SedimentSvg.vue";
import CultureSvg from "../components/CultureSvg.vue";
</script>

<style scoped>
.landing-page {
  padding: var(--spacing-lg);
}

.landing-content {
  --landing-tile-size: clamp(16rem, 18vw, 20rem);

  max-width: var(--layout-content-max-width);
  margin: 0 auto;
  container-type: inline-size;
  container-name: landing;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, var(--landing-tile-size)));
  gap: clamp(var(--spacing-lg), 4vw, var(--spacing-2xl));
  justify-content: center;
  align-items: start;
}

.grid > * {
  inline-size: 100%;
  max-inline-size: var(--landing-tile-size);
  aspect-ratio: 1 / 1;
  justify-self: center;
  overflow: hidden;
}

@container landing (max-width: 44rem) {
  .grid {
    --landing-tile-size: clamp(13rem, 32vw, 17rem);
  }
}

@container landing (max-width: 30rem) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-md);
  }
}

@container landing (max-width: 22rem) {
  .grid {
    grid-template-columns: minmax(0, var(--landing-tile-size));
  }
}

/* UTI Section */
.uti-section {
  margin-top: var(--spacing-xl, 2rem);
}

.uti-heading {
  font: var(--md-sys-typescale-title-medium);
  color: var(--md-sys-color-on-surface-variant);
  margin: 0 0 var(--spacing-md);
}

.uti-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.uti-tile {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  text-decoration: none;
  color: inherit;
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    box-shadow var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
}

.uti-tile:hover {
  background: var(--md-sys-color-surface-container);
  box-shadow: var(--md-sys-elevation-1);
}

.uti-tile-title {
  font: var(--md-sys-typescale-title-small);
  color: var(--md-sys-color-primary);
}

.uti-tile-desc {
  font: var(--md-sys-typescale-body-small);
  color: var(--md-sys-color-on-surface-variant);
}

@container landing (max-width: 37.5rem) {
  .uti-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@container landing (max-width: 30rem) {
  .uti-grid {
    grid-template-columns: 1fr;
  }
}

@media only screen and (max-width: 479.98px) {
  .landing-page {
    padding: var(--spacing-sm);
  }
}
</style>
