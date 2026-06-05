# AI Authoring Guide Voor Richtlijnwebsites

Dit document is bedoeld voor AI-agents die van richtlijnteksten, databestanden, protocollen,
PDF's, tabellen of andere bronnen een beslismodel-website maken met het Urinest.rip framework.
Het doel is dat iedere vraag, antwoordoptie, toelichting, uitslag, waarschuwing en zichtbare claim
herleidbaar, verdedigbaar, gebruikersvriendelijk en rolspecifiek is.

Deze guide is normatief voor nieuwe domeinen zoals CVRM, COPD, DM, ouderenzorg, triage en
praktijkprotocollen. Urinestrip blijft de eerste referentie-implementatie.

## Niet Onderhandelbare Regels

1. Geen klinische claim komt in de UI zonder bronverdediging.
2. Iedere vraag heeft een expliciete reden: waarom wordt deze vraag gesteld, op welk moment in de
   flow, voor welke rol, en wat is het risico als de vraag ontbreekt.
3. Iedere antwoordoptie is compleet, onderling onderscheidend en klinisch relevant voor de
   vervolgstap.
4. Iedere info-knop legt alleen uit wat een gebruiker nodig heeft om veilig te antwoorden of de
   aanbeveling te begrijpen.
5. Rolschakelaars veranderen vragen, resultaten en acties op basis van verantwoordelijkheden, niet
   op basis van voorkeur of cosmetiek.
6. Gebruikerstaal is kort, concreet en passend bij de zorgrol, maar verliest geen klinische
   precisie.
7. Onzekerheid, conflicterende bronnen en lokale beleidskeuzes worden zichtbaar gemarkeerd in de
   traceability-matrix voordat ze in de UI komen.
8. Vrije tekst, patientherleidbare data en niet-noodzakelijke identificatoren blijven buiten flows,
   telemetry en storage.
9. Een flow is pas klaar wanneer compiler, traceability, role/context tests, security/privacy checks
   en UX-review groen zijn.

## Input Die Een Agent Eerst Moet Inventariseren

Leg deze inventaris vast voordat YAML of UI-copy wordt geschreven.

| Input | Verplicht | Vastleggen |
| --- | --- | --- |
| Bronnen | Ja | Titel, organisatie, URL, publicatie- of revisiedatum, geraadpleegd op, versie, jurisdictie |
| Domeinscope | Ja | Wat valt in de flow, wat valt er expliciet buiten, wanneer moet worden verwezen |
| Doelgebruikers | Ja | Arts, triagist, doktersassistent, verpleegkundige, POH en eventueel lokale rollen |
| Verantwoordelijkheden | Ja | Wat elke rol zelfstandig mag doen, moet overleggen, moet doorzetten of niet mag zien |
| Beslisdoelen | Ja | Welke uitkomsten de flow moet onderscheiden en welke acties daaruit volgen |
| Data-elementen | Ja | Welke vragen nodig zijn, bron per element, type, toegestane waarden en privacyklasse |
| Rekenregels | Indien relevant | Formules, variabelen, eenheden, afronding, validatierange en bron |
| Lokale keuzes | Indien relevant | Praktijkbeleid, formularium, werkafspraken en wie deze heeft goedgekeurd |
| Reviewbeleid | Ja | Klinisch eigenaar, technische eigenaar, maximale reviewleeftijd en vervaldatum |

Wanneer een bron geen stabiele publieke URL heeft, gebruik dan een interne bron-ID met bewaarlocatie
en auditnotitie. De UI mag nog steeds alleen informatie tonen die door de klinisch eigenaar is
goedgekeurd.

## Verplichte Output-Artefacten

Een AI-agent levert per domein minimaal deze artefacten op:

1. Flowbestanden in `flows/` of in een extern domeinpackage.
2. Bronregister met bron-ID's, versies en reviewdatums.
3. Question Defense Matrix voor iedere vraag en antwoordoptie.
4. Role Responsibility Matrix voor alle zichtbare rollen.
5. Claim Defense Matrix voor resultaten, waarschuwingen, documentatiecopy en info-knoppen.
6. Plain-language copy review met terminologiekeuzes.
7. Testmatrix voor paden, rollen, contexten, calculators en veiligheidsgevallen.
8. Telemetry/privacy matrix met toegestane events, verboden velden en scrub-regels.
9. Klinische reviewnotitie met open onzekerheden en expliciete akkoordpunten.

Voor Urinest.rip staat de huidige bronmatrix in `docs/guideline-traceability.json` en de toelichting
in `docs/guideline-traceability.md`.

## Bronregister

Elke bron krijgt een stabiele ID. Gebruik dezelfde ID in flowmetadata, traceability, tests en
reviewnotities.

Minimale velden:

- `id`: stabiele kebab-case ID, bijvoorbeeld `nhg-cvrm-2024`.
- `title`: volledige brontitel.
- `publisher`: verantwoordelijke organisatie.
- `url`: HTTPS-link wanneer beschikbaar.
- `version`: versie, revisienummer of publicatiedatum.
- `checkedOn`: datum waarop de bron opnieuw is gecontroleerd.
- `appliesTo`: domeinen, rollen, vragen of resultaten waarvoor de bron wordt gebruikt.
- `limitations`: bekende beperkingen, onzekerheid, lokale afwijkingen of conflicten.

Een bron is onvoldoende wanneer alleen een URL is toegevoegd. De agent moet expliciet vastleggen
welke bewering of beslisstap door die bron wordt ondersteund.

## Question Defense Matrix

Maak voor iedere vraag een matrixrecord voordat de vraag in YAML terechtkomt.

| Veld | Betekenis |
| --- | --- |
| `questionId` | Exacte vraag-ID in de flow |
| `label` | Zichtbare vraagtekst |
| `clinicalPurpose` | Waarom deze vraag nodig is voor de beslissing |
| `placementReason` | Waarom de vraag op deze positie in de flow staat |
| `roleVisibility` | Rollen die de vraag zien, inclusief reden per rol |
| `sourceIds` | Bronnen die de vraag en de antwoordset ondersteunen |
| `omissionRisk` | Wat fout kan gaan als de vraag ontbreekt |
| `answerModel` | Type, toegestane waarden, defaults en invalid states |
| `optionDefense` | Verdediging per antwoordoptie |
| `infoButton` | Of toelichting nodig is, en zo ja: tekst, bron en reden |
| `copyRationale` | Waarom de tekst begrijpelijk en klinisch precies is |
| `privacyClass` | Geen PHI, indirect klinisch, mogelijk PHI of verboden |
| `testCases` | Minimale paden waarin de vraag geraakt moet worden |

Voorbeeld:

```yaml
questionDefense:
  questionId: q_has_fever
  label: Heeft de patient koorts of koude rillingen?
  clinicalPurpose: Onderscheidt lokale klachten van mogelijke weefselinvasie.
  placementReason: Vroeg in de flow omdat dit urgentie en beleid bepaalt.
  roleVisibility:
    triagist: zichtbaar; bepaalt urgentiecategorie en overlegnoodzaak.
    arts: zichtbaar; bepaalt diagnostiek en behandeling.
    doktersassistent: zichtbaar als triagevoorbereiding; geen behandeladvies tonen.
    verpleegkundige: zichtbaar binnen protocol; overleg bij alarmsymptomen.
    poh: alleen zichtbaar wanneer het protocol dit domein aan POH delegeert.
  sourceIds: [nhg-uwi, nhg-triagewijzer]
  omissionRisk: Mogelijke pyelonefritis of sepsis-risico wordt gemist.
  answerModel:
    type: select
    values: [yes, no, unknown]
  optionDefense:
    yes: Activeert urgentere route of artsbeoordeling.
    no: Laat lokale-klachtenroute toe wanneer andere alarmsymptomen ontbreken.
    unknown: Voorkomt valse geruststelling en leidt naar veilige vervolgstap.
  infoButton:
    needed: true
    text: Vraag naar gemeten temperatuur, koude rillingen of ziek zijn.
    sourceIds: [nhg-uwi]
  copyRationale: Concrete observaties, geen jargon als 'systemisch ziek' zonder uitleg.
  privacyClass: indirect-clinical
```

## Antwoordopties

Een antwoordoptie is pas acceptabel wanneer deze:

- brononderbouwd is of expliciet als lokale workflowkeuze is gemarkeerd;
- geen overlap heeft met andere opties;
- samen met de andere opties alle veilige routes afdekt;
- een duidelijke technische waarde heeft die niet aan zichtbare tekst is gekoppeld;
- voor iedere rol hetzelfde betekent;
- niet stuurt naar een te laag veiligheidsniveau bij twijfel;
- in tests minimaal een happy path en een veiligheidsvariant heeft wanneer de optie beleid wijzigt.

Gebruik `unknown`, `not_applicable` of `needs_review` alleen wanneer er een expliciete veilige route
bestaat. Een onbekend antwoord mag nooit stilzwijgend als `no` worden behandeld.

## Info-Knoppen En Toelichting

Info-knoppen zijn verplicht wanneer een vraag of antwoord:

- klinische definities gebruikt die per richtlijn kunnen verschillen;
- een afkapwaarde, formule, score of meetmethode gebruikt;
- risico heeft op verkeerd interpreteren door een rol;
- lokale beleidsafspraak nodig heeft;
- een contra-indicatie, alarmsymptoom of verwijscriterium uitlegt;
- een bronbeperking of onzekerheid bevat die de keuze beinvloedt.

Info-knoppen mogen niet worden gebruikt als opslagplaats voor lange richtlijnsamenvattingen.
Schrijf maximaal wat nodig is om veilig te kiezen. Link of citeer de bron via de traceability-laag.

Minimale info-button verdediging:

```yaml
infoButton:
  needed: true
  trigger: "term is ambiguous for DA/VPK"
  text: "Met flankpijn wordt pijn in zij of rug bedoeld, passend bij nierbetrokkenheid."
  sourceIds: [nhg-uwi]
  roles: [triagist, doktersassistent, verpleegkundige]
  riskIfMissing: "Gebruiker kan lokale pijn verwarren met alarmsymptoom."
```

## Resultaten, Adviezen En Documentatiecopy

Voor ieder resultaat moet de agent vastleggen:

- welke vraag-antwoorden tot dit resultaat leiden;
- welke bron de conclusie ondersteunt;
- welke actie de gebruiker mag uitvoeren;
- welke actie alleen door een andere rol mag worden gedaan;
- welke waarschuwingen, contra-indicaties of vervolgcriteria gelden;
- welke EPD- of verslagcopy veilig kan worden gebruikt;
- welke patientvriendelijke uitleg bij het resultaat hoort;
- welke brononzekerheid of lokale afspraak bestaat;
- welke telemetry-events worden verzonden zonder klinische inhoud te lekken.

Resultaten moeten bronlinks in de UI houden. In Urinest.rip controleert de compiler al dat ieder
resultaat minimaal een HTTPS-bron heeft. De traceability-gate controleert daarnaast dekking van
vragen, resultaten en redirects.

## Rolmodel En Verantwoordelijkheden

Het framework moet rollen als context behandelen. De rol bepaalt:

- welke vragen relevant en toegestaan zijn;
- welke toelichtingen nodig zijn;
- welke resultaten zichtbaar zijn;
- welke acties zelfstandig mogen worden uitgevoerd;
- wanneer overleg, overdracht of verwijzing nodig is;
- welke documentatiecopy passend is.

Gebruik minimaal deze generieke rollen wanneer het domein ze nodig heeft:

| Rol | Doel in flow | Typische UI-aanpassing |
| --- | --- | --- |
| `arts` | Diagnose, behandeling, voorschrijven, medisch eindverantwoordelijk beleid | Volledige diagnostiek, behandelopties, contra-indicaties, documentatiecopy |
| `triagist` | Urgentie, veiligheid, vervolgroute en overlegcriteria | Alarmsymptomen, urgentiecategorie, geen zelfstandig voorschrijfadvies |
| `doktersassistent` | Intake, triagevoorbereiding, protocolhandelingen | Heldere vraagtaal, overlegcriteria, beperkte acties |
| `verpleegkundige` | Geprotocolleerde zorg en monitoring | Protocolacties, escalatiecriteria, follow-up |
| `poh` | Chronische zorg, controles en leefstijlbegeleiding | Monitoring, risicoprofiel, follow-up, arts-overleg bij afwijkingen |
| `admin` | Beheer, logs, bronstatus en publicatiecontrole | Geen klinische vragenlijstmodus; alleen beheertaken |

Per domein moet een Role Responsibility Matrix bestaan:

```yaml
roles:
  arts:
    canAsk: [all]
    canSeeTreatment: true
    canDocumentTreatment: true
    mustEscalateWhen: []
  doktersassistent:
    canAsk: [triage, intake, measurement]
    canSeeTreatment: false
    canDocumentTreatment: false
    mustEscalateWhen: [red_flags, unclear_answers, protocol_outside_scope]
  poh:
    canAsk: [monitoring, risk_profile, lifestyle, medication_check]
    canSeeTreatment: limited-by-domain
    canDocumentTreatment: protocol-dependent
    mustEscalateWhen: [new_red_flags, high_risk_score, medication_contraindication]
```

De rolknop moet begrijpelijk zijn en persistent genoeg voor normaal gebruik, maar wijzigingen midden
in een vragenlijst moeten veilig zijn. Als een rolwissel de beslisroute of zichtbare acties wijzigt,
moet de flow herberekend of opnieuw gestart worden met duidelijke feedback.

## Gebruikersvriendelijke Taal

Schrijf voor drukke zorgprofessionals:

- korte zinnen;
- een vraag per scherm of per duidelijke stap;
- concrete woorden boven abstracte termen;
- vaktermen alleen waar ze nodig zijn;
- vaktermen uitleggen in info-knoppen;
- geen dubbele ontkenningen;
- geen impliciete tijdsvensters;
- geen antwoordopties die klinisch hetzelfde betekenen;
- geen geruststellende tekst bij onzekerheid;
- geen patientbeschuldigende formuleringen.

Vervang:

- "systemische verschijnselen" door "koorts, koude rillingen of ziek zijn" wanneer dat klinisch
  klopt;
- "mictieklachten" door "pijn of branderigheid bij plassen, vaker plassen of aandrang" wanneer de
  doelgroep dit nodig heeft;
- "beleid conform richtlijn" door de concrete actie die de gebruiker moet doen.

Gebruik nooit vriendelijke taal als excuus om nuance te verwijderen. Als een begrip exact moet zijn,
houd het klinische woord en voeg toelichting toe.

## Flow-YAML Richtlijnen

Het huidige compilercontract ondersteunt flowvelden, vragen, opties, stappen, resultaten en
resultaatlogica. Onbekende velden kunnen in de brondata bestaan, maar een agent mag daar niet op
vertrouwen voor runtimegedrag totdat schema, compiler en UI ze expliciet ondersteunen.

Minimale flowmetadata voor nieuwe domeinen:

```yaml
id: cvrm-risk-intake
version: "1.0.0"
title: CVRM risicoprofiel
description: Gestructureerde intake voor cardiovasculair risico.
category: chronische-zorg
audience: [arts, poh, verpleegkundige]
domain: cvrm
recommendedStart: true
metadata:
  authoringContract: guideline-v1
  reviewed: "2026-06-02"
  sourceIds: [nhg-cvrm, prevent-equations]
  owner: "clinical-owner-id"
  privacyClass: "no-free-text"
```

Vraagvoorbeeld:

```yaml
questions:
  - id: q_smoking
    type: select
    label: Rookt de patient?
    description: Nodig voor risicoberekening en leefstijladvies.
    metadata:
      sourceIds: [nhg-cvrm]
      questionPurpose: "Risicofactor voor CVRM-risico en behandeladvies."
      placementReason: "Vroeg nodig omdat PREVENT en leefstijladvies rookstatus gebruiken."
      roleVisibility:
        arts: "Mag diagnose en beleid bepalen."
        poh: "Mag intake en leefstijladvies voorbereiden binnen protocol."
        verpleegkundige: "Mag protocolintake uitvoeren wanneer lokaal gedelegeerd."
      omissionRisk: "Risico kan te laag worden ingeschat."
      answerModel:
        type: select
        values: [yes, no, unknown]
        invalidStates: [missing]
      copyRationale: "Korte concrete taal zonder calculatorjargon."
      privacyClass: indirect-clinical
      infoButton:
        needed: true
        text: "Gebruik de actuele rookstatus. Ex-roken hoort bij 'nee' tenzij de calculator anders vraagt."
        sourceIds: [nhg-cvrm, prevent-equations]
    options:
      - value: yes
        label: Ja
        metadata:
          sourceIds: [nhg-cvrm]
          optionDefense: "Ja activeert roken als risicofactor."
          infoButton:
            needed: false
            reason: "Optietekst is eenduidig."
      - value: no
        label: Nee
        metadata:
          sourceIds: [nhg-cvrm]
          optionDefense: "Nee laat niet-rokenroute toe wanneer bron dit toestaat."
          infoButton:
            needed: false
            reason: "Optietekst is eenduidig."
      - value: unknown
        label: Onbekend
        metadata:
          sourceIds: [nhg-cvrm]
          optionDefense: "Onbekend voorkomt valse precisie bij ontbrekende informatie."
          safeRoute: "Vraag aanvullen voordat risicoberekening definitief wordt."
          infoButton:
            needed: false
            reason: "Onbekend is gewone veilige fallback."
```

Resultaatvoorbeeld:

```yaml
results:
  needs-risk-calculation:
    title: Risico nog niet definitief
    description: Vul ontbrekende gegevens aan voordat het beleid wordt bepaald.
    explainer: De risicoschatting kan veranderen als ontbrekende gegevens later worden toegevoegd.
    documentation: CVRM-risico nog niet definitief berekend; ontbrekende gegevens besproken.
    sources:
      - name: NHG-Standaard Cardiovasculair risicomanagement
        url: https://richtlijnen.nhg.org/standaarden/cardiovasculair-risicomanagement
```

## Calculators En Data-Extensies

Specifieke calculators, zoals PREVENT voor CVRM, horen niet in core. Core levert alleen een generiek
calculatorcontract. Een domeinpackage levert:

- calculator-ID en versie;
- inputschema met eenheden en validatieranges;
- bronverdediging voor iedere input;
- formule- of implementatiebron;
- rounding- en missing-data gedrag;
- testvectors uit de bron of klinisch goedgekeurde fixtures;
- rolbeleid voor wie de calculator mag gebruiken of interpreteren;
- telemetrybeleid zonder ruwe klinische inputwaarden.

Een calculatorresultaat mag pas UI-copy sturen wanneer de bronverdediging ook de interpretatie en
actiedrempels dekt.

## Telemetry En Privacy

Telemetry moet helpen bij kwaliteit en foutopsporing, niet bij het reconstrueren van patientroutes.

Toegestaan:

- flow-ID;
- flowversie;
- rol;
- technische stap-ID;
- outcome-type, bijvoorbeeld `redirect` of `result`;
- gehashte of geredacte foutcontext;
- performance timing;
- feature/config-versie.

Verboden zonder expliciete privacyreview:

- vrije tekst;
- geboortedatum, BSN, naam, adres, telefoonnummer, e-mail;
- ruwe meetwaarden of calculatorinputs;
- volledige antwoordset;
- URL's met klinische routeparameters;
- brondata die indirect een patient kan identificeren.

Elke nieuwe telemetry-event krijgt:

```yaml
telemetryDefense:
  event: questionnaire_result_resolved
  purpose: "Controleren of flowroutes technisch eindigen."
  fields: [flowId, flowVersion, role, outcomeType]
  forbiddenFields: [answers, freeText, patientIdentifiers, rawCalculatorInputs]
  retention: "app policy"
  scrubber: "required"
```

## Testmatrix

Een domein is niet klaar zonder tests voor:

- alle resultaten en redirects;
- dead ends;
- rol/context-matrix;
- onbekende of ontbrekende antwoorden;
- calculatorgrenzen, eenheden en afronding;
- contra-indicaties en alarmsymptomen;
- source/traceability coverage;
- UI-labels en info-knoppen;
- keyboardnavigatie en focusvolgorde;
- reduced motion;
- telemetry scrubber;
- storage zonder PHI;
- bundle/performance budget;
- consumer fixture die het package buiten Urinest.rip gebruikt.

Gebruik in deze repo minimaal:

```bash
npm run build:flows
npm run check:guidelines
npm run check
npm run check:tsgo
npm run lint:all
npm run format:check
npm run check:framework
npm run build
npm run test
```

## AI-Werkproces

Volg deze volgorde. Sla geen stap over.

1. Source intake: verzamel bronnen, versies, datums, scope en eigenaar.
2. Source normalization: maak bron-ID's, termenlijst en conflictlog.
3. Role modelling: maak Role Responsibility Matrix voor alle rollen.
4. Decision graph: schets flow, vragen, resultaten, redirects en calculators.
5. Question defense: verdedig iedere vraag en antwoordoptie.
6. Claim defense: verdedig iedere zichtbare claim, info-knop, waarschuwing en resultcopy.
7. Plain-language pass: herschrijf naar rolgeschikte taal met behoud van klinische precisie.
8. YAML authoring: schrijf flowdata met stabiele IDs en bronmetadata.
9. Traceability authoring: werk bronmatrix en claimmatrix bij.
10. Test authoring: voeg rol-, pad-, calculator-, a11y- en privacytests toe.
11. Local gates: draai build, checks en tests.
12. Human review: klinisch eigenaar tekent bronnen, scope, vragen en resultaten af.
13. Release note: noteer inhoudelijke wijzigingen, reviewdatum en bekende beperkingen.

## Prompt Templates Voor AI-Agents

### Bronextractie

```text
Lees de bron en extraheer alleen normatieve beslisinformatie.
Maak bron-ID's, definities, criteria, uitzonderingen, drempelwaarden, rolrestricties,
bewijszekerheid en open onzekerheden. Geef per item de exacte bronlocatie terug.
Voeg geen UI-copy toe.
```

### Vraagverdediging

```text
Verdedig deze voorgestelde vraag voor een beslismodel.
Geef: clinicalPurpose, placementReason, roleVisibility, sourceIds, omissionRisk,
answerModel, optionDefense, infoButton, copyRationale, privacyClass en minimale tests.
Markeer de vraag als reject wanneer bron, verantwoordelijkheid of veilige vervolgstap ontbreekt.
```

### Rolreview

```text
Controleer deze flow voor rollen arts, triagist, doktersassistent, verpleegkundige en POH.
Geef per rol welke vragen zichtbaar zijn, welke acties zichtbaar zijn, wat verboden moet blijven,
waar overleg nodig is, en welke tests ontbreken.
```

### Plain-Language Review

```text
Herschrijf de zichtbare tekst voor drukke zorgprofessionals.
Behoud klinische precisie. Maak onduidelijke termen concreet. Verplaats uitleg naar info-knoppen
wanneer de hoofdvraag anders te lang wordt. Verander geen medische betekenis.
```

### Traceability Review

```text
Controleer of iedere vraag, antwoordoptie, info-knop, resultaattekst, waarschuwing,
documentatiecopy en redirect een bronverdediging heeft.
Rapporteer gaps als blokkerend. Gebruik geen algemene uitspraak als 'conform richtlijn'
zonder bron-ID en concrete claim.
```

## Per-Domein Acceptatiechecklisttemplate

Deze lijst is een template voor iedere nieuwe richtlijn of behandelprotocol. Het is geen open
projectstatus voor deze repo; kopieer de items naar het domeindossier en vink ze daar af met
bronverwijzingen, testnamen en klinische eigenaar.

- Bronregister compleet met versies, URLs, beperkingen en reviewdatums.
- Iedere vraag heeft een Question Defense Matrix-record.
- Iedere antwoordoptie heeft bron, betekenis, veilige route en testdekking; in
  `docs/guideline-traceability.json` gebeurt dit met `optionClaims` zodra een flow in
  `optionDefenseRequiredForFlows` staat.
- Iedere info-knop heeft reden, tekst, rollen en bron.
- Iedere zichtbare claim heeft bronverdediging.
- Iedere resultkaart heeft HTTPS-bronlinks.
- Iedere redirect is inhoudelijk verantwoord.
- Role Responsibility Matrix dekt arts, triagist, doktersassistent, verpleegkundige, POH en
  domeinspecifieke rollen.
- Rolschakelaar toont alleen verantwoordelijkheid-passende vragen en acties.
- Geen rol krijgt behandeladvies buiten verantwoordelijkheid.
- Gebruikerstaal is getest op ambiguiteit en onnodig jargon.
- Calculators zitten in domeinpackages, niet in core.
- Calculatorinputs hebben bron, eenheid, validatierange en tests.
- Telemetry bevat geen PHI, ruwe antwoorden of calculatorinputs.
- Storage bevat geen PHI en heeft configureerbare keys/TTL waar nodig.
- Compiler en traceability-gate zijn groen.
- Role/context matrix tests zijn groen.
- A11y en keyboardroute zijn gecontroleerd.
- Klinisch eigenaar heeft scope, bronnen, vragen, resultaten en beperkingen goedgekeurd.

## Blokkerende Rode Vlaggen

Stop publicatie wanneer:

- een vraag of resultaat geen bronverdediging heeft;
- een antwoordoptie als `unknown` naar een normale `no`-route gaat;
- een triage- of DA-rol behandeladvies ziet dat voorschrijfbevoegdheid suggereert;
- een calculator een formule gebruikt zonder versie of testvectors;
- een info-knop een andere medische betekenis toevoegt dan de hoofdvraag;
- UI-copy brononzekerheid verbergt;
- telemetry ruwe antwoorden, vrije tekst of patientidentificatoren kan bevatten;
- lokale beleidskeuzes niet als lokaal beleid herkenbaar zijn;
- een flow bij rolwissel of redirect in een onduidelijke overgang blijft hangen;
- testdekking alleen happy paths bevat.

## Relatie Met Bestaande Gates

De huidige repo heeft al:

- strict flow-build via `npm run build:flows`;
- guideline traceability via `npm run check:guidelines`;
- result-source validatie in de compiler van `@moranje/beslismodel/compiler`;
- Urinestrip path tests in `src/__tests__/flows.test.ts`;
- package consumer checks via `npm run check:framework`.

Nieuwe domeinen moeten deze gates blijven gebruiken en uitbreiden met role/context-, calculator-,
a11y-, telemetry- en consumer-fixtures. Wanneer deze guide strenger is dan de huidige compiler, is
de guide leidend en wordt het ontbrekende compiler- of UI-contract als frameworkwerk toegevoegd.
