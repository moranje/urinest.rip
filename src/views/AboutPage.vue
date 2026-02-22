<template>
  <div class="about-page">
    <div class="about-content">
      <h2>Over dit project</h2>
      <p>
        Deze website is gemaakt als beslishulp bij urineonderzoek in de huisartsenpraktijk. De
        website is gebaseerd op de
        <a
          href="https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst"
          target="_blank"
          >NHG-standaard Urineweginfecties</a
        >, de
        <a href="https://www.nvkc.nl/kwaliteit/richtlijnen/normen-en-richtlijnen" target="_blank"
          >NVKC richtlijn</a
        >, de
        <a
          href="https://www.nvu.nl/kwaliteitsbeleid/richtlijnen/actuele-richtlijnen/"
          target="_blank"
          >NVU richtlijn Hematurie</a
        >
        en de
        <a
          href="https://www.verenso.nl/richtlijnen-en-praktijkvoering/richtlijnendatabase/urineweginfecties"
          target="_blank"
          >Verenso richtlijn</a
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
              <a v-if="g.url" :href="g.url" target="_blank">{{ g.name }}</a
              ><span v-else>{{ g.name }}</span>
            </td>
            <td>{{ g.reviewed }}</td>
          </tr>
        </tbody>
      </table>

      <h3>Gebruik</h3>
      <p>
        Gebruik is gratis. Feedback kan via
        <a href="https://github.com/moranje/urinest.rip" target="_blank">Github</a> of via
        <a href="https://web.siilo.com/#/signin" target="_blank">Siilo</a>.
      </p>
      <h3>Features</h3>
      <ul>
        <li>Snel genoeg voor iedere urine test</li>
        <li>Statusvoering kopieerbaar naar het EPD</li>
        <li>Werkt offline</li>
        <li>Transparante bronvermeldingen</li>
        <li><a href="https://github.com/moranje/urinest.rip" target="_blank">Open source</a></li>
      </ul>
      <h3>Auteur</h3>
      <p><a href="https://www.linkedin.com/in/martienoranje" target="_blank">Martien Oranje</a></p>

      <p class="build-info">v{{ version }} · bijgewerkt {{ buildDate }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const version = __APP_VERSION__;
const buildDate = __BUILD_DATE__;

const guidelines = [
  {
    name: "NHG-Standaard Urineweginfecties",
    url: "https://richtlijnen.nhg.org/standaarden/urineweginfecties",
    reviewed: "22 februari 2026",
  },
  {
    name: "Verenso richtlijn Urineweginfecties",
    url: "https://www.verenso.nl/richtlijnen-en-praktijkvoering/richtlijnendatabase/urineweginfecties",
    reviewed: "21 februari 2026",
  },
  {
    name: "NVKC richtlijn Urineonderzoek",
    url: "https://www.nvkc.nl/kwaliteit/richtlijnen/normen-en-richtlijnen",
    reviewed: "21 februari 2026",
  },
  {
    name: "NVU richtlijn Hematurie",
    url: "https://www.nvu.nl/kwaliteitsbeleid/richtlijnen/actuele-richtlijnen/",
    reviewed: "21 februari 2026",
  },
  {
    name: "NHG-TriageWijzer Urinewegproblemen",
    url: "https://triagewijzer.nhg.org/ingangsklachten/urinewegproblemen",
    reviewed: "21 februari 2026",
  },
];
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
