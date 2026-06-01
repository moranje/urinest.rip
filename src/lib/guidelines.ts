export interface GuidelineReview {
  name: string;
  url: string;
  reviewed: string;
  reviewedIso: string;
}

export const guidelineReviews: GuidelineReview[] = [
  {
    name: "NHG-Standaard Urineweginfecties",
    url: "https://richtlijnen.nhg.org/standaarden/urineweginfecties",
    reviewed: "1 juni 2026",
    reviewedIso: "2026-06-01",
  },
  {
    name: "Verenso richtlijn Urineweginfecties",
    url: "https://www.verenso.nl/richtlijnen-en-praktijkvoering/richtlijnendatabase/urineweginfecties",
    reviewed: "1 juni 2026",
    reviewedIso: "2026-06-01",
  },
  {
    name: "NVKC richtlijn Urineonderzoek",
    url: "https://www.nvkc.nl/kwaliteit/richtlijnen/normen-en-richtlijnen",
    reviewed: "1 juni 2026",
    reviewedIso: "2026-06-01",
  },
  {
    name: "NVU richtlijn Hematurie",
    url: "https://www.nvu.nl/kwaliteitsbeleid/richtlijnen/actuele-richtlijnen/",
    reviewed: "1 juni 2026",
    reviewedIso: "2026-06-01",
  },
  {
    name: "NHG-TriageWijzer Urinewegproblemen",
    url: "https://triagewijzer.nhg.org/ingangsklachten/urinewegproblemen",
    reviewed: "1 juni 2026",
    reviewedIso: "2026-06-01",
  },
];
