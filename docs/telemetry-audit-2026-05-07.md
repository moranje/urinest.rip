# Urinest.rip — Telemetry GAP Analyse 2026-05-07

**Auditor:** Claude Opus 4.7
**Vorige audit:** [2026-05-03](./telemetry-audit-2026-05-03.md) — Pad A (migratie naar `@oranje/telemetry`) aanbevolen
**Datum:** 2026-05-07 (4 dagen na vorige audit)
**App-versie:** 3.1.3 (`package.json`)
**Stack:** Vue 3.5 + Vite 7 + Pinia 3 + TypeScript + Supabase + decision-engine-core (tarball v1.0.0)
**Codebase:** 4727 LOC totaal in `src/` (views/components/store/lib/router/main); 8 YAML flows in `flows/`
**Domein:** Klinische beslishulp urineonderzoek voor huisartsen — NHG/Verenso/NVKC/NVU richtlijnen
**Risico-classificatie:** **Mission-critical** — een onjuiste of stille flow-uitkomst kan tot foute klinische beslissing leiden (gemiste UWI behandeling, gemiste pyelonefritis-verwijzing, verkeerde antibiotica-keuze)

---

## 1. Skip-gate

| Criterium | Status |
|---|---|
| Project bestaat? | ja (`/Users/martien/Sync/Projects/code/urinest.rip`) |
| Is een leverable web-app (geen library)? | ja — Vue 3 SPA, productie-deploy via Netlify |
| Heeft gebruikers in productie? | ja — huisartsen, AZC-locaties; PWA install-flow |
| Bevat error-paden van clinische relevantie? | ja — flow-engine, results-mapping |
| Significante codeverandering sinds 2026-05-03? | nee — 3 console.error nog onveranderd, geen `@oranje/telemetry` adoptie, geen scrubber-tests toegevoegd |

**Verdict:** **Niet skippen** — vorige SPEC niet uitgevoerd, alle gaps blijven open. Audit blijft relevant.

---

## 2. Scope-check

| Aspect | Waarde | Telemetry-implicatie |
|---|---|---|
| `fetch()` calls in productiecode | 1 (`store/questionnaireStore.ts:143` -> `/main.json`) | minimaal — stateless app, gecompileerde flows uit static asset |
| Supabase calls | 7 (auth-getSession, auth-onAuthStateChange, auth-signIn, auth-signOut, rpc x2, insert app_logs, upsert log_resolutions) | overwegend admin-pad |
| Vue global error-handler | aanwezig (`main.ts:14`) -> `handleError` | pass |
| Vue ErrorBoundary-componenten | **0** | `errorCaptured()` ontbreekt; één throwende child-component vouwt de hele view dicht |
| Window `unhandledrejection`-listener | aanwezig (`main.ts:18`) -> `handleError` | pass |
| Window `error`-listener (sync errors buiten Vue) | **ontbreekt** | gap — async script errors uit PWA service-worker, image-load errors, custom event listeners worden gemist |
| PHI/persistente patient-data | **GEEN** (stateless beslishulp; antwoorden alleen in Pinia memory) | risico beperkt |
| PHI in input-velden? | **potentieel** — huidige flows hebben enkel multiple-choice; toekomstige vrije-tekst (notes/opmerkingen) zou wel PHI lekken via `error.message` of `breadcrumb-click` `option.text` | latente gap |
| Mission-critical | **JA** — klinische beslishulp |
| Decision-engine-core tarball-versie pinned | ja (`file:decision-engine-core-1.0.0.tgz`) | observability-vereiste: engine-failures MOETEN getelemetreerd worden |
| Bestaand telemetry-stack | maatwerk (827 LOC in `src/lib/`) — `logger`, `log-sink`, `breadcrumbs`, `error-context`, `errors` | functioneel ~80% van `@oranje/telemetry` |
| Sink-doel | Supabase `app_logs` met `source: 'urinestrip'` discriminator (gedeeld met patient-tracker via source-filtered RPCs) | werkend — admin-UI op `/admin/logs` |

**Conclusie scope:** Stateless, dus PHI-risico is laag-maar-niet-nul (vrije-tekst-velden zijn een **toekomstige scope-creep** die scrubber afdwingt). Mission-critical karakter eist dat **flow-engine** en **results-resolutie** observability hebben — dit is het hoofddoel van deze audit.

---

## 3. Inventarisatie

### 3.1 Code-volume per laag

| Bestand / map | LOC | Telemetry-rol |
|---|---|---|
| `src/main.ts` | 33 | bootstrapping: `errorHandler`, `unhandledrejection`, `initErrorContext`, `initLogSink`, `flushLogs` |
| `src/App.vue` | 100 | `loadInitialData` met `handleError` wrap |
| `src/lib/logger.ts` | 228 | 6-level structured logger, CSS-styled console, sink-systeem, module-filter |
| `src/lib/log-sink.ts` | 156 | batched persist (20-buffer, 2s flush, 5x circuit-breaker), FNV-1a fingerprint, session-ID |
| `src/lib/errors.ts` | 237 | classifier (network, timeout, postgrest, auth, dutch fallback), `handleError`, `withTimeout` |
| `src/lib/error-context.ts` | 128 | UA-parsing (browser/OS/device), source-location parser |
| `src/lib/breadcrumbs.ts` | 64 | ring-buffer 25, dedupe consecutive, nav/click/api/log helpers |
| `src/store/logStore.ts` | 188 | admin-dashboard data layer (RPCs, resolve/suppress) |
| `src/store/authStore.ts` | 56 | admin-only Supabase auth |
| `src/store/questionnaireStore.ts` | 242 | flow-engine integratie (`validateConditions`, `determineOutcome`) |
| `src/views/QuestionnairePage.vue` | 727 | hot-path — flow-rendering, navigation, antwoord-state |
| `src/views/ResultPage.vue` | 711 | hot-path — uitkomst-rendering, contraindicaties-checklist |
| **Totaal `src/`** | **4727** | |

### 3.2 `console.*` calls in productiecode

| # | Locatie | Code | Categorie |
|---|---|---|---|
| 1 | `views/QuestionnairePage.vue:175` | `console.error('Error loading questionnaire data', err)` | clinical-blocker (data laad-fout, redirect /error) |
| 2 | `views/ResultPage.vue:275` | `console.error('[ResultPage] Resultaat "${key}" niet gevonden...')` | **kritisch** — flow-engine produceert key die niet in `results` zit |
| 3 | `store/questionnaireStore.ts:150` | `console.error('Failed to load initial data', error)` | data-laad-fout — `/main.json` mislukt |

**Geen** van deze drie passeert het `log-sink` -> `app_logs` pad. Bug blijft onzichtbaar voor maintainer.

### 3.3 try/catch-blokken (totaal 17 catches in productie + admin)

| Type | Aantal | Telemetry-status |
|---|---|---|
| `} catch {` (volledig swallow, geen variabele) | 9 | *zwijgend* — geen log, geen toast |
| `} catch (e) { toastStore.error(...) }` | 2 | gebruiker ziet melding, geen `app_logs` |
| `} catch (e) { error.value = ... }` | 2 | UI-state, geen `app_logs` |
| `} catch (error) { handleError(...) }` | 1 (`App.vue:40`) | volledig pad — pass |
| `} catch (err) { console.error + redirect }` | 1 (`QuestionnairePage:174`) | escapt sink |
| `} catch (error) { console.error + throw }` | 1 (`questionnaireStore:149`) | escapt sink — re-throw landt in caller |
| `} catch { sink-error }` | 2 (`logger:198`, `log-sink:104`) | **must** swallow (anders oneindige lus) |

### 3.4 Flow-engine (decision-engine-core) error-paden

| Aanroep | Locatie | Try/catch? | Telemetry-event? |
|---|---|---|---|
| `validateConditions(answers, conditionList)` | `questionnaireStore.ts:198` (per vraag) | **nee** | nee — exceptions vallen door naar Vue errorHandler met context "vue:setup" zonder flow-id/step-id/condition-snippet |
| `determineOutcome(enhanced, logic)` | `questionnaireStore.ts:208` | **nee** | nee — zelfde |
| Outcome-mismatch (`results[key]` ontbreekt) | `ResultPage.vue:263-281` | nvt — `if (foundResult)` check | **alleen** `console.error` -> escapt sink |
| Outcome-redirect-loop (`type === 'redirect'`) | `QuestionnairePage.vue:271-276` | geen circuit-breaker | nee — oneindige lus mogelijk bij circulaire YAML |

**Dit is het grootste cluster open gaps.** Zie sectie 5 voor scenario-matrix.

### 3.5 Breadcrumbs

35 `breadcrumb*` aanroepen, voornamelijk:
- `breadcrumbNav` in `router.afterEach` -> alle navigatie wordt gevolgd
- `breadcrumbLog` automatisch via `logger.emit` voor warn+
- **Ontbreekt:** `breadcrumbClick` op `option-item` clicks in `QuestionnairePage.vue` (=de feitelijke beslis-acties van de huisarts, dus de meest relevante context bij een fout)
- **Ontbreekt:** `breadcrumbApi` rond `fetch /main.json` (handmatig nodig — geen interceptor)

### 3.6 Tests

| Type | Aantal |
|---|---|
| Unit test files (`*.test.ts`/`*.spec.ts`) | **0** |
| Vitest config aanwezig | ja (`package.json` heeft `"test": "vitest run"`) |
| Telemetry-laag test-coverage | **0%** |
| Scrubber-tests | n.v.t. (geen scrubber bestaat) |
| Flow-engine integratie-tests | 0 |

### 3.7 Recente wijzigingen sinds 2026-05-03

`git log --oneline --since="2026-05-03"` (verwacht): geen commits die telemetry raken. Vorige SPEC-U01 niet geïmplementeerd. Console.error-trio op identieke regelnummers.

---

## 4. Adoptie-SPEC: SPEC-UR01

### Header

| Veld | Waarde |
|---|---|
| **ID** | SPEC-UR01 |
| **Titel** | Telemetry-hardening voor klinische beslishulp Urinest.rip |
| **Type** | feature (uitbreiding van bestaande maatwerk-stack) **of** refactor (migratie naar `@oranje/telemetry`) — twee paden, beide acceptabel |
| **Impact** | **Medium-High** — een verkeerde uitkomst is medisch relevant; observability is voorwaarde voor veilige iteratie van flow-content |
| **Effort** | **S-M** — kleinere app (4727 LOC), stateless, geen migratie van persistente data nodig; bestaand `app_logs`-pad blijft |
| **Prioriteit** | P1 (na patient-tracker, gelijk met labbie) |
| **Owner** | Martien |
| **Doelversie** | 3.2.0 (minor bump door nieuwe observability-feature) |

### Probleem

1. **Drie `console.error`-calls** op clinical-critical paden produceren GEEN `app_logs`-rij:
   - `ResultPage.vue:275` — meest kritisch: flow-engine geeft key terug die niet in `results` zit. Klinische manifestatie: huisarts ziet "Resultaat niet gevonden" zonder dat iemand het merkt. Dit is exact het scenario waar telemetry medisch relevant is.
   - `QuestionnairePage.vue:175` — flow-data laad-fout (offline na cache-invalidatie, CDN-uitval, build-corruptie).
   - `questionnaireStore.ts:150` — `/main.json` HTTP-fout — zelfde categorie.

2. **`decision-engine-core`-aanroepen zonder guard.** `validateConditions` (per vraag, dus warm-pad) en `determineOutcome` kunnen op malformed YAML een TypeError werpen. Ze worden niet ingepakt; Vue errorHandler vangt het, maar de context is "vue:setup" zonder flow-id/step-id/condition. Om de oorzaak te vinden moet je de stacktrace + breadcrumb-replay handmatig terugleiden naar een YAML-regel.

3. **Geen errorBoundary** in component-tree. Een throw uit de markdown-renderer (`marked.parse` op malformed description) klapt de hele view dicht zonder graceful fallback. `errorCaptured` ontbreekt op `App.vue` of `QuestionnairePage.vue`.

4. **PHI-scrubber ontbreekt.** Huidige flows zijn multiple-choice dus risico is laag. Maar:
   - `error.message` van een `ZodError`-achtig pad zou een ingevoerde patient-leeftijd of klacht-tekst kunnen bevatten zodra een vrije-tekst-vraag wordt toegevoegd.
   - `breadcrumb-click` heeft geen scrubbing en logt `option.text` rauw.
   - Geen bewuste deny-list voor woorden als `BSN`, `geboortedatum`, etc.

5. **`window.error`-listener ontbreekt.** Sync-errors buiten Vue (PWA service-worker `onerror`, image-load failures, third-party script crashes) worden gemist.

6. **Circuit-breaker is silent.** Na 5 fails stopt `flushLogs` zonder in-band signaal aan dashboard ("sink down"). Maintainer ziet pas later dat er geen logs meer zijn.

7. **Geen runtime richtlijn-versie-check.** `AboutPage.vue` heeft `reviewed`-datums; bij een NHG-update is er geen telemetry-event ("flow X is N dagen oud t.o.v. publicatie-datum").

8. **`marked.parse(...)` zonder sanitisatie.** `option.description` en `currentQuestion.description` worden ge-`v-html`-d. XSS-risico is laag (input is YAML van maintainer, niet user) maar een telemetry-event op render-fail ontbreekt.

9. **Outcome-redirect-loop.** `QuestionnairePage.vue:271-276` doet `router.replace` op `redirect:`-uitkomst zonder bezoekteller. Een circulaire YAML (flow A redirect naar B, B redirect naar A) zou silent infinite loop opleveren.

### Oplossing

#### Pad B (S-effort, 4-6u) — bestaande maatwerk-stack uitbreiden

**Aanbevolen voor deze ronde** omdat de stack al volwassen is en migratie naar `@oranje/telemetry` (Pad A uit vorige audit) een grotere refactor is. Pad B sluit ALLE 9 gaps zonder nieuwe dependency:

1. **Wrap de drie `console.error`** in `handleError()`:
   ```ts
   // QuestionnairePage.vue:175
   } catch (err) {
     handleError(err, 'questionnaire:mount')
     isLoading.value = false
     router.replace('/error')
   }
   // ResultPage.vue:275
   handleError(
     new Error(`Resultaat "${key}" niet gevonden in results-map`),
     'result:lookup',
   )
   // questionnaireStore.ts:150
   } catch (error) {
     handleError(error, 'flow:load-main-json')
     throw error
   }
   ```

2. **Wrap decision-engine-core** met flow-context:
   ```ts
   // questionnaireStore.ts
   const validateConditions = (qId, conditions, providedAnswers = null) => {
     try {
       return validateConditionsEngine(currentAnswers, conditions)
     } catch (e) {
       handleError(e, `flow:validateConditions:${qId}`)
       return { isValid: false, reason: 'engine-error' }
     }
   }
   ```
   Idem voor `determineOutcome` met `qId` + outcome-key in context.

3. **Vue ErrorBoundary** via `errorCaptured` op `App.vue`:
   ```ts
   onErrorCaptured((err, instance, info) => {
     handleError(err, `boundary:${info}`)
     return false // stop propagation, App-level fallback rendert
   })
   ```

4. **PHI-scrubber** als nieuwe `src/lib/scrubber.ts` (40-60 LOC):
   - Deny-list (BSN-pattern `\b\d{9}\b`, geboortedatum `\d{2}-\d{2}-\d{4}`, e-mail, telefoon).
   - Toepassen in `log-sink.persistError` op `userMessage`, `devDetail`, en `breadcrumb.message`.
   - Unit-tests (10-15 cases, eerste tests in deze codebase).

5. **`window.error`-listener** in `main.ts`:
   ```ts
   window.addEventListener('error', (e) => {
     handleError(e.error ?? e.message, 'window:error')
   })
   ```

6. **Circuit-breaker observability**: bij `consecutiveFailures >= MAX_FAILURES` één keer een `console.warn` + `localStorage.setItem('log_sink_down', timestamp)`. Admin-UI leest dit en toont een banner.

7. **Richtlijn-versie-event**: bij `loadInitialData` één `log.info('flow.versions', { reviewed: {...} })` per flow zodat dashboard datums kan plotten.

8. **`marked.parse` try-wrapper** in `compiledMarkdown` helpers — bij fail terug naar plain-text + `handleError`.

9. **Redirect-cycle-guard** in `determineResult`: `Set<string>` van bezochte questionnaire-ids; bij hit -> `handleError('redirect-cycle')` + redirect `/error`.

#### Pad A (M-effort, 8-12u) — migratie naar `@oranje/telemetry`

Onveranderd t.o.v. 2026-05-03. **Niet aanbevolen voor deze cyclus** maar hoort op de roadmap zodra `@oranje/telemetry` zijn scrubber-test-suite geconsolideerd heeft over labbie + patient-tracker.

### Acceptatiecriteria

- [ ] Geen `console.error/warn` meer in `src/views/`, `src/store/`, `src/lib/` (uitgezonderd binnen `logger.ts` zelf en log-sink fail-paths)
- [ ] Elke `decision-engine-core`-aanroep is in try/catch met flow-id/step-id/question-id in context
- [ ] `errorCaptured` aanwezig op `App.vue`
- [ ] `src/lib/scrubber.ts` met unit-tests (minimaal 10) — eerste tests in repo
- [ ] `window.addEventListener('error', ...)` toegevoegd
- [ ] Redirect-cycle guard met test-fixture (mini YAML met A->B->A)
- [ ] `marked.parse` failures worden gelogd
- [ ] Smoke-test in dev: forceer `results[key]` mismatch, verifieer `app_logs`-rij verschijnt

---

## 5. Error-Scenario Matrix (25 rijen)

| # | Scenario | Trigger | Component / regel | Huidige observability | Klinisch risico | Telemetry-actie SPEC-UR01 |
|---|---|---|---|---|---|---|
| 1 | Flow-data laad mislukt (HTTP 5xx op `/main.json`) | CDN/Netlify down | `questionnaireStore.ts:143` | `console.error` + throw -> alleen Vue-handler vangt re-throw | hoog — app onbruikbaar | wrap in `handleError('flow:load-main-json')` |
| 2 | `/main.json` returnt corrupte JSON | bad build, partial deploy | `questionnaireStore.ts:147` | Vue handler vangt parse-error met context "vue:setup" | hoog | extra try rond `response.json()` met `'flow:parse'` |
| 3 | Flow-key in URL bestaat niet (`/questionnaire/onbekend`) | typo in deeplink, oude bookmark | `QuestionnairePage.vue:194` | silent `router.replace('/')` | midden | `log.warn('flow:unknown-id', { id })` |
| 4 | `validateConditions` throwt (malformed YAML) | maintainer-fout in flow YAML | `questionnaireStore.ts:198` | Vue handler — context "vue:setup", geen flow-id | **kritisch** | wrap met flow-id/question-id, fail-soft (`isValid: false`) |
| 5 | `determineOutcome` throwt | malformed `resultsLogic` | `questionnaireStore.ts:208` | zelfde | **kritisch** | wrap met flow-id, fail-soft naar `/error` met explicit message |
| 6 | Outcome-key niet in `results` | flow-engine -> result mismatch | `ResultPage.vue:275` | `console.error` only | **kritisch — patient krijgt geen advies** | `handleError(new Error('result-not-found'), 'result:lookup')` |
| 7 | Outcome-redirect-loop A->B->A | circulaire `redirect:` | `QuestionnairePage.vue:271-276` | infinite navigation, geen log | hoog | `Set` cycle-guard + `handleError('redirect-cycle')` |
| 8 | `marked.parse` throwt op malformed description | maintainer-fout | `QuestionnairePage:347`, `ResultPage` | Vue handler, generieke context | laag-midden (UI broken, advies onleesbaar) | try-wrap, fallback plain-text, `log.warn('markdown:parse')` |
| 9 | Markdown XSS (sanitisatie ontbreekt) | maintainer error of supply-chain | `v-html` op compiledMarkdown | n.v.t. — geen detectie | midden | `marked` met `sanitizer` + log bij strip |
| 10 | LocalStorage-quota exceeded | privacy-mode browser, vol kvk | `breadcrumbs.ts` (geen LS gebruik), `log-sink` (sessionStorage) | sessionStorage write-fail valt door naar Error | laag | try-wrap rond `sessionStorage.setItem` met `'storage:quota'` |
| 11 | Supabase env-vars ontbreken in productie | misconfig CI | `lib/supabase/client.ts` | silent `null` return — alle telemetry uitgezet | **kritisch — observability blackout** | startup-check: `log.error('supabase:not-configured')` (paradox: zonder sink alleen console — maar voorkomt blackout-by-default in dev) |
| 12 | Supabase RLS weigert insert | policy verkeerd, anon-key gewisseld | `log-sink.ts:95` | `consecutiveFailures++` silent, na 5 stop | hoog (blackout) | one-shot `console.warn` + `localStorage.log_sink_down` flag |
| 13 | Network offline tijdens flush | mobile, AZC-locatie wifi | `log-sink.ts:90` | buffer behoudt entries via `unshift`, retry op timer | laag (designed for) | `addEventListener('online', flushLogs)` toevoegen |
| 14 | Rapid offline/online flapping | mobile network | zelfde | risico op buffer-onbegrensde groei | laag | hard cap MAX_BUFFER 100, oudste droppen + counter |
| 15 | UnhandledRejection van extension/third-party | browser-extension injectie | `main.ts:18` | `handleError('unhandled-rejection')` -> persisteert noise | laag | filter op `error.stack` not in eigen domain |
| 16 | Vue-component throw tijdens render | regression in `ResultPage` v-for | `App.vue` | Vue handler, geen errorBoundary fallback | midden | `errorCaptured` met fallback-UI (huidige `ErrorPage`) |
| 17 | Service Worker registration fail | PWA, oude Safari | `vite-plugin-pwa` interne | n.v.t. — ontbreekt in `onRegisterError` | laag | hook `onRegisterError` -> `handleError('pwa:register')` |
| 18 | Stale SW serveert oude `/main.json` | cache-mismatch na deploy | `questionnaireStore.ts:143` (`?t=` busted) | `?t=` query bypassed cache, dus laag | laag | n/a — al opgelost |
| 19 | Race: 2x parallel `loadInitialData` | router beforeEnter + App.vue mount | `questionnaireStore.ts:134-159` | `loadingPromise` deduplication | laag — afgevangen | log.debug bij dedup hit (volume-monitor) |
| 20 | Outcome-string parse-fail (geen `:`) | malformed YAML `outcome: 'invalid'` | `QuestionnairePage.vue:268` | `[type, value] = 'invalid'.split(':')` -> `value = undefined` -> `/info/undefined` | **kritisch — broken result page** | guard + `handleError('outcome:malformed')` |
| 21 | Role-toggle mid-flow met andere uitkomst | gebruiker switcht behandelaar/triage | `roleStore.ts` -> `getEnhancedAnswers` | geen replay van oude state | laag-midden | `breadcrumb('role-change')` + `log.info` |
| 22 | Klembord-API niet beschikbaar (HTTP, oude browser) | `navigator.clipboard.writeText` | `ResultPage.vue:294` | `try/catch` -> toast 'Kopiëren mislukt' | laag (UX) | huidig pad ok, voeg `log.warn('clipboard:unsupported')` toe |
| 23 | Admin login Supabase rate-limit (429) | brute-force testen | `authStore.ts:38` | classifier vangt — toast `Te veel pogingen` | laag | huidig pad ok |
| 24 | PHI in toekomstige free-text vraag | scope-creep | n.v.t. nog | geen scrubber | hoog (compliance) | scrubber + tests (acceptatiecriterium) |
| 25 | Richtlijn-flow ouder dan NHG-publicatie | trage maintainer | `AboutPage.vue` `reviewed`-datum | hand-onderhouden, geen runtime-check | midden (klinisch verouderd advies) | `log.info('flow.versions', {flow:reviewedDate})` per startup |

**Samenvatting matrix:** 7 scenario's met klinisch risico **kritisch/hoog** zijn momenteel onvolledig gedekt (#1, #4, #5, #6, #7, #11, #20). SPEC-UR01 acceptatiecriteria sluiten deze allemaal.

---

## 6. Stand t.o.v. vorige audit (2026-05-03)

| Gap (vorige audit) | Status 2026-05-07 |
|---|---|
| Drie `console.error` op clinical-critical paden | **OPEN** — identieke regelnummers |
| `decision-engine-core` zonder try/catch | **OPEN** |
| Geen scrubber-tests | **OPEN** |
| Eigen classifier mist Postgres-codes | **OPEN** (lager prioriteit, admin-pad) |
| Sourcemap-upload | werkend (commit `0d15a74`) — geen regressie |
| `@oranje/telemetry`-adoptie (Pad A) | niet uitgevoerd — zie aanbeveling sectie 4 |

Geen achteruitgang, geen vooruitgang. Audit-score blijft hetzelfde.

---

## 7. Bijzondere overweging — gedeelde Supabase log-sink

De prompt suggereert "shared Supabase via public `log_events` tabel". De feitelijke implementatie gebruikt `app_logs` met `source: 'urinestrip'` als discriminator (zie `log-sink.ts:129`, source-filtered RPCs in `migrations/004`). Dit werkt correct — patient-tracker en urinest.rip delen één tabel met source-isolatie via RLS+RPC. **Geen actie nodig**, maar wel waard om in `CLAUDE.md` te documenteren zodat een toekomstige migratie naar `@oranje/telemetry` deze conventie behoudt (anders: dubbele schemas).

---

## 8. Aanbeveling

**Voer Pad B uit** (S-effort, 4-6u) om alle 9 problemen uit sectie 4 op te lossen zonder nieuwe dependency. Plan Pad A (migratie naar `@oranje/telemetry`) voor Q3 2026 zodra die package zijn scrubber-tests gestabiliseerd heeft over labbie + patient-tracker.

**Eerste test in deze repo schrijven** (`src/lib/scrubber.test.ts`) is bijproduct van Pad B en zet daarmee de drempel voor toekomstige test-coverage uitbreiding lager.

**Geen werk aan Pad A** zolang er nog geen geünificeerde `@oranje/telemetry`-API beschikbaar is buiten patient-tracker.

---

## Appendix A — Bestandsindex

- `src/main.ts` — bootstrap
- `src/lib/logger.ts`, `log-sink.ts`, `errors.ts`, `error-context.ts`, `breadcrumbs.ts` — telemetry-stack
- `src/lib/supabase/client.ts` — Supabase singleton (graceful null)
- `src/store/{questionnaireStore,logStore,authStore,roleStore,toastStore}.ts`
- `src/views/{Landing,Questionnaire,Result,Error,About}Page.vue`
- `src/views/admin/{AdminLogin,LogDashboard}.vue`
- `src/components/admin/{LogGroupList,LogDetail,StackTrace,LogFilters}.vue`
- `supabase/migrations/{001_app_logs,002_log_resolutions,003_rpc_functions,004_source_filtered_rpcs}.sql`
- `flows/*.yaml` — 8 klinische flows (gecompileerd door Vite-plugin)

## Appendix B — Telemetry-laag in één diagram

```
[Vue componenten] -- handleError() --> [classifyError]
                                            |
                                            v
                                       [logger.error]
                                            |
                          +-----------------+--------------------+
                          v                                      v
                    [console (CSS)]                    [breadcrumbLog]
                          |                                      |
                          +-----------+                          v
                                      v                  [breadcrumb-buffer]
                            [emit -> sinks]
                                      |
                                      v
                             [persistError]
                                      |
                                      v
                            [buffer (max 20)]
                                      |
                            flush every 2s
                                      v
                       [Supabase app_logs.insert]
                                      |
                            (5x fail -> circuit-break)
                                      |
                                      v
                          [Admin UI /admin/logs]
                                  (RPC + grouping)
```
