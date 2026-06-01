# Richtlijntraceerbaarheid

Deze repo behandelt flow-inhoud als klinische productcode. Iedere zichtbare vraag, antwoordset,
resultaatkaart en redirect in `public/main.json` moet daarom onderbouwd zijn in
`docs/guideline-traceability.json`.

Voor nieuwe richtlijnwebsites, domeinpakketten en AI-gegenereerde flows geldt aanvullend
`docs/ai-guideline-authoring.md`. Die guide beschrijft hoe bronregister, vraagverdediging,
antwoordopties, info-knoppen, rolverantwoordelijkheden, gebruikerstaal, telemetry/privacy en tests
moeten worden opgebouwd voordat content wordt gepubliceerd.

## Gate

Run:

```bash
npm run build
npm run check:guidelines
```

De gate faalt wanneer:

- een flow, vraag, antwoordset, resultaatkaart of redirect niet in de matrix staat;
- een matrix-entry naar een onbekende bron verwijst;
- een resultaatkaart geen HTTPS-bronlink heeft;
- een richtlijnreview ouder is dan `maxReviewAgeDays` in de matrix.

## Review 2026-06-01

Primaire bronnen zijn opnieuw gecontroleerd op 1 juni 2026:

- NHG-Standaard Urineweginfecties: diagnostiek, beleid, risicogroepen, katheterbeleid,
  zwangerschap, profylaxe, pivmecillinam en ketamine-alert.
- NHG LESA Laboratoriumdiagnostiek: nitriet/leukocytenvolgorde, dipslide, sediment en kweek.
- Verenso Urineweginfecties bij kwetsbare ouderen: symptoomcriteria, niet behandelen van
  asymptomatische bacteriurie en katheterbeleid.
- NVU Hematurie 2023 en NVKC/FMS hematurie-laboratoriumdiagnostiek: zichtbare hematurie,
  microscopische hematurie, proteinurie en sedimentbevestiging.
- NHG-TriageWijzer: publieke urgentiecategorieen voor U2/U3-labels; inhoudelijke
  UWI-beslissingen blijven gekoppeld aan NHG/Verenso.

## Inhoudelijke conclusie

De flowstappen zijn compleet voor de scope van deze app: urineonderzoek in de huisartsenpraktijk
en triage/beleid na testuitslagen. Pivmecillinam is bewust niet als standaard behandeloptie
toegevoegd: de NHG-bron adviseert terughoudendheid en beschrijft lage tot zeer lage
bewijszekerheid ten opzichte van bestaande opties.

De actuele NHG ketamine-alert is verwerkt als waarschuwing bij negatieve of niet-toepasbare
UWI-uitkomsten. Dat is bewust geen extra universele vraag, omdat de richtlijn dit formuleert als
alert bij onverklaarde, therapieresistente of recidiverende urologische klachten, vooral bij
jongvolwassenen.
