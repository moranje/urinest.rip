<template>
  <div class="about-page">
    <div class="about-content">
      <h2>Over dit project</h2>
      <p>
        Deze website is gemaakt als beslishulp bij urineonderzoek in de huisartsenpraktijk.
        De website is gebaseerd op de
        <a href="https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst" target="_blank">NHG-standaard Urineweginfecties</a>,
        de <a href="https://www.nvkc.nl/kwaliteit/richtlijnen/normen-en-richtlijnen" target="_blank">NVKC richtlijn</a>,
        de <a href="https://www.nvu.nl/kwaliteitsbeleid/richtlijnen/actuele-richtlijnen/" target="_blank">NVU richtlijn Hematurie</a>
        en de <a href="https://www.verenso.nl/richtlijnen-en-praktijkvoering/richtlijnendatabase/urineweginfecties" target="_blank">Verenso richtlijn</a>.
      </p>
      <h3>Gebruik</h3>
      <p>Gebruik is gratis. Feedback kan via <a href="https://github.com/moranje/urinest.rip" target="_blank">Github</a> of via <a href="https://web.siilo.com/#/signin" target="_blank">Siilo</a>.</p>
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
    </div>
  </div>
</template>

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
</style>
