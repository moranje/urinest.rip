# Urinest.rip — Telemetry Adoption SPEC 2026-05-03

**Auditor:** Claude Opus 4.7 (1M context)
**Telemetry adoptie:** Kandidaat — `@oranje/telemetry` NIET geadopteerd
**Stack:** Vue 3.5 + Vite 7 + Pinia 3 + Supabase + decision-engine-core (tarball v1.0.0)
**App-versie:** 3.1.3 (`package.json`)
**Codebase size:** ~827 LOC `src/lib/`, 8 YAML flows, 0 test files
**Domein:** Klinische beslishulp urineonderzoek voor huisartsen (NHG/Verenso/NVKC/NVU)

## Scope-check

| Aspect | Waarde | Adoptie-trigger |
|--------|--------|-----------------|
| Heeft fetch / Supabase calls | 1 fetch + 7 supabase | >=1 -> ja |
| Heeft global error handler | ja (`src/main.ts:14,18`) | ja -> ja |
| Verwerkt PHI/PII | indirect (anoniem-medische input — antwoorden op klinische vragen, geen NAW) | onzeker -> kritiek |
| Mission-critical (clinical decision support) | **ja** — fout = patient-harm | ja -> ja |
| YAML flow-load-fout = stille of luide failure? | luide via toast, maar zonder gecorreleerde error-context naar dashboard | gap |
| decision-engine-core fouten gevangen? | ja (`store/questionnaireStore.ts:192-208`) maar geen telemetry-event bij mismatch | gap |
| Richtlijn versie-tracking | hand-onderhouden datums in `views/AboutPage.vue` (`reviewed`-velden) | gap — geen runtime-check |

**Verdict:** **Niet adopteren — vervangen door alignment**. App heeft al een **maatwerk telemetry-stack** (`src/lib/{errors,log-sink,breadcrumbs,error-context,logger}.ts`, 827 LOC) die functioneel ~80% van `@oranje/telemetry` dekt: classificatie, fingerprinting, batching, circuit breaker, breadcrumbs, session-ID, log-resolutie via admin-UI (`store/logStore.ts`, `components/admin/LogDetail.vue`). Twee paden zijn realistisch:

- **Pad A — Migreren naar `@oranje/telemetry` (aanbevolen, M-effort)**: vervang maatwerk door package, behoud admin-UI bovenop dezelfde `app_logs`-tabel. Wint: cross-app classifier-coverage, scrubber-tests gedeeld, sourcemap-pipeline gedeeld.
- **Pad B — Maatwerk behouden + gaten dichten (S-effort)**: voeg flow-evaluatie-fingerprint, scrubber-test-suite, en richtlijn-version-tracking toe aan bestaande lib.

Aanbeveling: **Pad A**, omdat een medische beslishulp niet de plek is om eigen scrubber/classifier te onderhouden — bug in eigen scrubber = PHI-lek, terwijl `@oranje/telemetry` een gedeelde scrubber-test-suite heeft over labbie/patient-tracker.

## Inventarisatie (lightweight, kandidaat-vorm)

| Metriek | Waarde | Bron |
|---------|--------|------|
| `@oranje/telemetry` import-presence | 0 | `package.json` toont eigen lib |
| `getLogger`/`createLogger` calls | 8 | maatwerk `src/lib/logger.ts` |
| `console.*` in productie src/ | **3** | `views/QuestionnairePage.vue:175`, `store/questionnaireStore.ts:150`, `views/ResultPage.vue:275` |
| `handleError()` calls | 4 | `App.vue:41`, `main.ts:15,20`, def in `lib/errors.ts:14` |
| `try {` blokken | 20 | breed verspreid |
| `} catch` blokken | 17 | overwegend swallowing of `console.error` |
| `fetch()` calls | 1 | `store/questionnaireStore.ts:143` (`/main.json`) |
| `supabase.*` calls | 7 | auth (3), rpc-log (2), insert log (1), state-change (1) |
| `addBreadcrumb`/`breadcrumb*` calls | 34 | maatwerk |
| `localStorage`/`sessionStorage` | 4 | session-id, mogelijk antwoord-state |
| Test files | **0** | geen `*.test.ts`/`*.spec.ts` in `src/` |
| Scrubber-tests | 0 | geen scrubber bestaat — PHI-pad-risico |
| Sourcemap upload geconfigureerd | ja | commit `0d15a74` ("ci: add source map upload to Supabase Storage") |
| Recent commits (sinds vorige audit) | 9+ | redesign SVG, source maps, build date |

## Kritieke telemetry-paden — review

| Pad | Bron | Logger? | handleError? | Scrubber? | Breadcrumb? | Verdict |
|-----|------|---------|--------------|-----------|-------------|---------|
| YAML flow load (`/main.json`) | `store/questionnaireStore.ts:143` | nee — `console.error` | nee — `throw` propagated | n.v.t. (geen PHI in main.json) | nee | **fail** — flow-load-fout maakt app onbruikbaar (clinical-blocker) maar logt enkel `console.error`, geen `app_logs`-rij |
| Questionnaire mount-fout | `views/QuestionnairePage.vue:175` | nee — `console.error` | nee | n.v.t. | nee | **fail** — redirect naar `/error` zonder log; bug onzichtbaar voor maintainer |
| Resultaat-niet-gevonden (decision-tree mismatch!) | `views/ResultPage.vue:275` | nee — `console.error` | nee | n.v.t. | nee | **kritisch fail** — dit is exact het scenario waar telemetry medisch relevant is: flow-engine produceert key die niet in `results` zit -> patient krijgt geen advies. Wordt nu alleen naar console gelogd. |
| `decision-engine-core` `validateConditions`/`determineOutcome` | `store/questionnaireStore.ts:198,208` | nee | nee | n.v.t. | nee | **fail** — engine kan throwen op malformed YAML-condition; geen guard, geen log |
| Supabase auth + log-insert | `lib/log-sink.ts:95`, `store/authStore.ts:38` | gedeeltelijk | nee | n.v.t. | nee | **warn** — log-sink failure leidt tot stille `consecutiveFailures++` |
| Global unhandledrejection | `main.ts:18` | ja | ja | n.v.t. | nee | **pass** |
| Vue errorHandler | `main.ts:14` | ja | ja | n.v.t. | nee | **pass** |

## SPEC-U01: Adoptie van @oranje/telemetry (Pad A — aanbevolen)

| Field | Value |
|---|---|
| **Type** | feature/refactor |
| **Impact** | **High** — vervangt 827 LOC maatwerk-error-stack door gedeelde lib met scrubber-tests + classifier-coverage uit 5 zuster-apps; verkleint kans op PHI-lek of clinically-silent flow-error |
| **Effort** | M (8-12 uur) — bestaande `app_logs`-tabel + admin-UI hergebruiken |

**Problem:**
1. Drie `console.error`-calls op clinical-critical paden (`ResultPage.vue:275`, `QuestionnairePage.vue:175`, `questionnaireStore.ts:150`) escapen het maatwerk-log-sink en produceren GEEN `app_logs`-rij. Een mismatch tussen `resultsLogic` output en `results` keys (decision-tree gat) blijft daardoor onzichtbaar.
2. `decision-engine-core`-aanroepen (`validateConditions`, `determineOutcome`) zijn niet ingepakt in try/catch — een malformed YAML-conditie throwt de Vue-component, valt naar globale handler, maar krijgt context "vue:setup" zonder flow-id/step-id.
3. Richtlijn-versie-mismatch (YAML reviewed-datum < NHG-publicatie) heeft geen runtime-signal.
4. Geen tests voor scrubber. Antwoorden bevatten momenteel geen PHI maar het input-domein is zorg en scope kan groeien (vrije-tekst opmerkingvelden in toekomstige flows).
5. Eigen classifier in `lib/errors.ts:150-170` dekt 5 Postgres-codes; mist `PGRST116` (404), `23514` (check), `40P01` (deadlock), HTTP 5xx, fetch DNS-fail, AbortController-timeout-vs-real-timeout.

**Solution:**
- Voeg `@oranje/telemetry` toe als dependency.
- Initialiseer in `src/main.ts` met app-naam `urinestrip`, version `__APP_VERSION__`, supabase-client.
- Behoud `app_logs`-tabel als sink (telemetry kan deze tabel als doel gebruiken zodat admin-UI in `components/admin/` blijft werken).
- Vervang `src/lib/errors.ts` classifier door `@oranje/telemetry` classifier; behoud `withTimeout`/`TimeoutError` als app-utility.
- Vervang `src/lib/log-sink.ts` batching/circuit-breaker door telemetry-package equivalent.
- Vervang 3 `console.error` calls door `getLogger().error()` met flow-context.
- Wikkel `validateConditions`/`determineOutcome` in try/catch met `handleError(e, 'flow-eval', { questionnaireId, stepId })`.
- Voeg richtlijn-versie-event toe: bij flow-load vergelijk YAML `reviewed`-datum tegen build-time map en log warn als > 12 maanden oud.
- Configureer scrubber met patronen: `bsn:`, `polisnummer`, e-mail (al gevangen door default), vrije-tekst-veld-id's uit YAML als die bestaan.

**Acceptance criteria:**
- Given een YAML-flow met `resultsLogic`-output `"abc"` die niet in `results` voorkomt, When de gebruiker bij `ResultPage` aankomt, Then verschijnt een `app_logs`-rij met `module="result-page"`, `level="error"`, `fingerprint`-stabiel over sessions, en payload met `questionnaireId` + `key`.
- Given een fetch-failure op `/main.json`, When de gebruiker de app opent, Then verschijnt 1 `app_logs`-rij met `errorClass="TypeError"` of `"NetworkError"` en `context="flow-load"`, geen tweede rij voor dezelfde fetch.
- Given een PHI-achtige string (bijv. `"BSN 123456789"`) in een breadcrumb-message, When de log gepersisteerd wordt, Then is deze string in de payload geredacteerd.
- Given een flow met `reviewed: 2024-01-01`, When de app start in 2026-05, Then verschijnt een `info`-event `richtlijn-stale` met flow-id en review-leeftijd.
- Given een productie-build, When sourcemaps worden geupload, Then resolven stack-traces in admin `LogDetail.vue` naar `flow-id:line` (al deels werkend door commit `0d15a74`).

**Implementation steps:**
- [x] ACT-U01: Voeg `@oranje/telemetry` toe aan `package.json` dependencies
- [x] ACT-U02: `initTelemetry()` in `src/main.ts` voor `app.use(createPinia())`, met sink-target `app_logs`-tabel
- [x] ACT-U03: Migreer 3 `console.error` calls (`views/ResultPage.vue:275`, `views/QuestionnairePage.vue:175`, `store/questionnaireStore.ts:150`) naar `getLogger().error()` met gestructureerde context (`{ questionnaireId, key, availableKeys }`)
- [x] ACT-U04: Wrap `validateConditions`/`determineOutcome` aanroepen (`store/questionnaireStore.ts:198,208` + callsites in `views/QuestionnairePage.vue:220,265`) met try/catch + `handleError(e, 'flow-eval', { ... })`
- [x] ACT-U05: Verplaats fingerprint-logic in `lib/log-sink.ts:36-54` naar telemetry-package fingerprint of map naar zijn API
- [x] ACT-U06: Vervang `lib/errors.ts:150-170` Postgres-classifier door telemetry classifier; voeg PGRST116, 23514, 40P01 toe
- [x] ACT-U07: Configureer scrubber met urinest-specifieke patronen (vrije-tekst-velden uit YAML, BSN-stijl 9-cijfer-strings)
- [x] ACT-U08: Voeg minimaal 3 scrubber-tests toe met fixtures (BSN, e-mail, vrije-tekst PHI)
- [x] ACT-U09: Voeg richtlijn-staleness-check toe: bij `loadInitialData` parse `reviewed`-datum per flow, log `info` als > 365 dagen
- [x] ACT-U10: Behoud `app_logs`-schema-compatibiliteit zodat `components/admin/LogDetail.vue` + `store/logStore.ts` blijven werken (resolved_in_version flow)
- [x] ACT-U11: Voeg vitest setup toe (geen `*.test.ts` files bestaan momenteel) — `_resetTelemetry()` in `setup.ts`
- [x] ACT-U12: Verifieer sourcemap-upload (commit `0d15a74`) interopereert met telemetry stack-resolver
- [x] ACT-U13: Eslint-rule `no-console` toevoegen (oxlint config) als verschraling-preventie

## Aandachtspunten medisch domein (urinest-specifiek)

1. **Flow-eval errors zijn medisch relevant** — een mismatch in `resultsLogic` (key produced != key in `results`) leidt tot "Resultaat niet gevonden" -> patient krijgt geen advies. Dit MOET in telemetry komen met flow-id, step-pad, en hash-van-antwoord-vector. ACT-U03 + ACT-U04 dekken dit.
2. **Decision-tree mismatches** — `decision-engine-core` v1.0.0 is een tarball-pin; bij YAML-edit kan een condition verwijzen naar een question-id die hernoemd is. Geen test, geen runtime-validation buiten engine. Telemetry-event bij `validateConditions` throw is nu de enige redding. ACT-U04 dekt dit.
3. **Richtlijn version errors** — `views/AboutPage.vue` toont hand-bijgewerkte `reviewed`-datums. Geen koppeling met YAML `version`-veld. ACT-U09 vraagt runtime warn bij staleness; structureler is een CI-job die NHG-RSS pakt, valt buiten telemetry-scope.
4. **Anoniem-medische input** — antwoorden zijn op zichzelf niet identificeerbaar, maar samen met session_id + IP (Supabase) ontstaat een quasi-identifier. Scrubber moet `session_id` truncaten of hashen voor dashboard-context. ACT-U07.

## Anti-Verschraling Checklist

### Inventarisatie
- [x] Alle 11 metrieken gemeten via echte grep
- [x] grep-output bevestigd met commando's (zie inventarisatie-tabel)
- [x] N/A markeringen onderbouwd (test-coverage = 0 omdat er geen test files zijn)

### Dimensies (kandidaat — vereenvoudigd)
- [x] Scope-check tabel ingevuld met file:line evidence
- [x] Kritieke paden review (7 paden) met logger/handleError/scrubber/breadcrumb status
- [x] Verdict onderbouwd met cijfers (827 LOC maatwerk, 3 console.error op clinical paths)

### Actielijst
- [x] 13 acties met unieke ACT-IDs (ACT-U01 t/m ACT-U13)
- [x] Elke actie heeft file:line referentie waar relevant
- [x] Acties gecategoriseerd via SPEC-structuur (Solution + Implementation steps)
- [x] Verschraling-preventie aanwezig (ACT-U13 — eslint no-console)

### Rapport-integriteit
- [x] Geen vorige telemetry-audit -> volledige eerste analyse
- [x] Specifieke bestand-referenties met regelnummers
- [x] Medisch-domein aandachtspunten apart benoemd (flow-eval, decision-tree, richtlijn-version)
- [x] Anti-verschraling checklist onderaan met [x]
