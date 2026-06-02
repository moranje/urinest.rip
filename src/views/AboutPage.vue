<template>
  <div class="about-page">
    <div class="about-content">
      <h1>Over dit project</h1>
      <p>
        Deze website is gemaakt als beslishulp bij urineonderzoek in de huisartsenpraktijk. De
        website is gebaseerd op de
        <TextLink href="https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst"
          >NHG-standaard Urineweginfecties</TextLink
        >, de
        <TextLink href="https://www.nvkc.nl/kwaliteit/richtlijnen/normen-en-richtlijnen"
          >NVKC richtlijn</TextLink
        >, de
        <TextLink href="https://www.nvu.nl/kwaliteitsbeleid/richtlijnen/actuele-richtlijnen/"
          >NVU richtlijn Hematurie</TextLink
        >
        en de
        <TextLink
          href="https://www.verenso.nl/richtlijnen-en-praktijkvoering/richtlijnendatabase/urineweginfecties"
          >Verenso richtlijn</TextLink
        >.
      </p>

      <h3>Richtlijnen</h3>
      <table class="guidelines-table">
        <thead>
          <tr>
            <th>Richtlijn</th>
            <th>Geraadpleegd</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in guidelines" :key="g.name">
            <td>
              <TextLink v-if="g.url" :href="g.url">{{ g.name }}</TextLink
              ><span v-else>{{ g.name }}</span>
            </td>
            <td>{{ g.reviewed }}</td>
          </tr>
        </tbody>
      </table>

      <h3>Gebruik</h3>
      <p>
        Gebruik is gratis. Feedback kan via
        <TextLink href="https://github.com/moranje/urinest.rip">Github</TextLink> of via
        <TextLink href="https://web.siilo.com/#/signin">Siilo</TextLink>.
      </p>
      <h3>Features</h3>
      <ul>
        <li>Snel genoeg voor iedere urine test</li>
        <li>Statusvoering kopieerbaar naar het EPD</li>
        <li>Werkt offline</li>
        <li>Transparante bronvermeldingen</li>
        <li><TextLink href="https://github.com/moranje/urinest.rip">Open source</TextLink></li>
      </ul>
      <h3>Auteur</h3>
      <p><TextLink href="https://www.linkedin.com/in/martienoranje">Martien Oranje</TextLink></p>

      <p class="build-info">v{{ version }} · bijgewerkt {{ buildDate }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import TextLink from "../components/primitives/TextLink.vue";
import { guidelineReviews } from "../lib/guidelines";

const version = __APP_VERSION__;
const buildDate = __BUILD_DATE__;

const guidelines = guidelineReviews;
</script>

<style scoped>
.about-page {
  padding: var(--spacing-lg);
}
.about-content {
  max-width: var(--layout-content-max-width);
  margin: 0 auto;
}
.about-content ul {
  padding-left: var(--spacing-lg);
}
.about-content li {
  margin-bottom: var(--spacing-sm);
}

.guidelines-table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--spacing-md) 0;
  font: var(--md-sys-typescale-body-medium);
}
.guidelines-table th {
  text-align: left;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 2px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-label-medium);
}
.guidelines-table td {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.build-info {
  margin-top: var(--spacing-xl);
  font: var(--md-sys-typescale-body-small);
  color: var(--md-sys-color-on-surface-variant);
}
</style>
