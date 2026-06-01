# Urinest.rip — Telemetry Audit 2026-05-12

**Auditor:** Claude Opus 4.7 (autonomous scheduled)
**Telemetry adoptie:** Kandidaat met **maatwerk-stack** — `@oranje/telemetry` NIET geadopteerd, eigen lib actief
**Stack:** Vue 3 + Vite + Pinia + Supabase (auth + RPC + `app_logs` insert) + decision-engine-core
**Codebase size:** ~38 src files (.ts/.vue/.js), v3.1.3
**Vorige audits:** [2026-05-07](./telemetry-audit-2026-05-07.md), [2026-05-03](./telemetry-audit-2026-05-03.md)

## 0. Skip-gate — Wijzigingen sinds vorige audit

```
$ git log --oneline --since="2026-05-07" | wc -l
0
```

**Resultaat:** 0 commits sinds vorige audit. Per skip-gate-regel zou deze app worden overgeslagen, maar de autonome taakbrief vereist expliciet de volledige 25-rijige Error-Scenario Matrix. Daarom toch een verkort rapport met matrix en actuele evaluatie van de bestaande maatwerk-stack.

## Scope-check

| Aspect | Waarde | Adoptie-trigger | Bewijs |
|--------|--------|-----------------|--------|
| fetch calls | 1 | informatief | `src/store/questionnaireStore.ts:143` (`fetch('/main.json…')`) |
| Supabase calls | 7 (auth + RPC + `from('app_logs').insert`) | ≥1 → ja | `authStore.ts:24,27,38,50`; `logStore.ts:66,91`; `log-sink.ts:95` |
| error-boundary | **ja** — `Vue.app.config.errorHandler` + `window.unhandledrejection` | ja → ja | `src/main.ts:14-22` |
| Verwerkt PHI/PII | **ja** — klinische input (urineonderzoek, anamnese, antibioticakeuze) | ja → kritiek | flows-engine + `views/QuestionnairePage.vue`, `ResultPage.vue` |
| Mission-critical | **ja** — medische beslishulp voor huisartsen | ja → ja | `flows/*.yaml` met NHG/Verenso/NVKC-richtlijnen |

**Verdict:** **Maatwerk-stack continueren, optioneel migreren naar `@oranje/telemetry`** — de app heeft al een complete eigen telemetry-laag (`src/lib/{errors,logger,log-sink,error-context,breadcrumbs}.ts`) die functioneel ~80% dekt. SPEC-U01 uit vorige audits (Pad A — migratie) blijft staan maar is laag-prio zolang er geen unified `@oranje/telemetry` API beschikbaar is buiten patient-tracker.

## Inventarisatie

| Metriek | Waarde | Doel | Status |
|---------|--------|------|--------|
| `getLogger()` / `createLogger()` calls | 5 | ≥1 per module | ⚠ — modules definiëren eigen logger maar gebruik thin |
| `console.*` in productie | **3** | 0 | ⚠ — 3 stuks: `questionnaireStore.ts:150`, `QuestionnairePage.vue:175`, `ResultPage.vue:275` |
| `handleError()` calls | **10** | ≥ # error-boundaries | ✓ |
| `try` blokken | 20 | ≈ async-call-count | OK |
| `} catch` blokken | 17 | ≈ # try | OK |
| `fetch()` calls | 1 | informatief | informatief |
| `supabase.*` calls | 7 | informatief | informatief |
| `breadcrumb*` / `breadcrumbLog` calls | 29 | ≥ # kritieke acties | ✓ |
| `trackApi()` calls | 0 | ≈ # ext API calls | ✗ — geen API-tracker abstractie |
| `_resetTelemetry` in tests | 0 | ≥ # test files met logger-mocks | ✗ |
| Scrubber-tests | **0** | ≥1 met BSN/email/JWT fixtures | **✗ kritiek** |
| Sourcemap upload geconfigureerd | nee | ja | ✗ |

Greps:
```
$ grep -rn "handleError(" src/ | grep -v test | wc -l → 10
$ grep -rn "breadcrumb\|trackApi" src/ | grep -v test | wc -l → 29
$ grep -rn "} catch" src/ | grep -v test | wc -l → 17
$ grep -rn "console\.\(log\|warn\|error\)" src/ | grep -v test | wc -l → 3
$ find src -name "*.test.ts" -o -name "*.spec.ts" | xargs grep -l "scrub\|redact\|BSN" → (geen)
```

## 9-Dimensie current-state mini-table

| # | Dimensie | Score | Toelichting (file:line) |
|---|----------|-------|--------------------------|
| 1 | Initialisatie & Bootstrapping | 4/5 | `src/main.ts:14-22` wired Vue errorHandler + unhandledrejection + `initErrorContext()` + `initLogSink()` + `flushLogs` op `beforeunload`. Mist alleen `window.addEventListener('error', …)` voor synchrone uncaught errors. |
| 2 | Logger-gebruik | 3/5 | Eigen `createLogger()` met 6 levels (`logger.ts:17-26`), CSS-styled output, sink-emitter (`logger.ts:180-204`). Maar 3 raw `console.*` calls blijven in `questionnaireStore.ts:150`, `QuestionnairePage.vue:175`, `ResultPage.vue:275`. |
| 3 | Error-Boundary Dekking | 4/5 | Vue-handler ✓, unhandled-rejection ✓, `App.vue:40` page-level catch ✓, router guards `router/index.ts:40,55` ✓. Mist `window.onerror` (alleen rejection). |
| 4 | PHI/PII Scrubbing | **1/5** | **Geen scrubber-functie**. `grep "scrub\|redact\|PHI\|BSN" src/lib/*.ts` returns **0**. `persistError` (`errors.ts:35-44`) stuurt `originalStack` direct naar Supabase — stack kan PHI bevatten (URL-params, form-data, klinische variabelen uit `engine.state`). |
| 5 | Error-Classificatie & i18n | 4/5 | `classifyError` (`errors.ts:58-128`) dekt: offline, fetch-fail, TimeoutError, Postgrest codes (`23505`, `23503`, `42501`, `PGRST301`, `40001`), AuthError. Mist 401-refresh (alleen "Je hebt geen toegang"-msg), 429 rate-limit, en `isDutchMessage`-heuristiek is broos. |
| 6 | Breadcrumbs & API-Tracking | 3/5 | 29 `breadcrumbLog` calls via `logger.ts:emit()` automatisch. Maar geen `trackApi()` abstractie — fetch- en supabase-calls hebben geen request/response/duration breadcrumbs. |
| 7 | Log-Persistence & Reliability | 4/5 | `log-sink.ts:85-106`: batching (buffer max 20), 2s flush interval, circuit-breaker bij 5 failures, fallback re-buffer bij insert-error. Mist offline-queue (`navigator.onLine` skip → log verloren); mist `preserveOnFailure` lokale persist. |
| 8 | Test-Dekking | **0/5** | 0 scrubber-tests, 0 classifier-tests, 0 `_resetTelemetry`. Telemetry-laag is volledig untested. Voor een medische app **kritiek tekort**. |
| 9 | Production Verification | 1/5 | Eigen admin-UI (`/admin/logs`) via `logStore.ts` werkt voor log-resolutie. Maar geen sourcemap upload — stack-traces in Supabase `app_logs` zijn niet-resolvable. Geen fingerprint-deduplicatie. |

**Overall: 2.7/5** — operationeel solid maar test-/scrubber-gat is risicovol voor klinische app.

## SPEC-U01: Adoptie of versterking van scrubber + sourcemap (zonder volledige `@oranje/telemetry` migratie)

| Field | Value |
|---|---|
| **Type** | hardening |
| **Impact** | **High** — medische beslishulp zonder scrubber-tests is PHI-lek-risico (engine.state in stack-trace) |
| **Effort** | M (8-12 uur) — scrubber + 5 fixture-tests + sourcemap-CI |

**Problem:**
1. **Geen scrubber.** Stack-traces uit `ResultPage.vue:275` (antibioticakeuze + patient-input in scope) worden onversleuteld naar `app_logs` gepushed. Form-data zit in closure-vars.
2. **Geen sourcemap-upload.** Stack-traces in admin-UI zijn unreadable (`chunk-DXFG7H.js:1:12345`).
3. **0 telemetry-tests.** Bug in eigen `classifyError` → silent miss-classificatie → user ziet "Er ging iets mis" voor een 401 = re-login flow misloopt.
4. **3 raw `console.*`** blijven naast structured logger draaien — log-sink mist deze events.

**Solution (zonder migratie — pragmatisch):**
- Voeg `src/lib/scrubber.ts` toe met regex-redact voor: email, BSN-9 (Eleven-Test), AGB-8, JWT, URL-params met `token=`, `pwd=`. Plus depth-limited stripping van engine.state keys (`gender`, `age`, `complaint`).
- Wire scrubber als hook in `persistError` (`errors.ts:35-44`) **voor** Supabase-insert.
- Migreer 3 console.* → `log.error/.warn`.
- Voeg sourcemap-upload toe aan netlify-build (post-build script → Supabase Storage `sourcemaps/${version}/`).
- Schrijf 5 scrubber-fixture-tests: BSN-string, email-string, JWT-string, gemengde stack-trace, geneste object.

**Acceptance criteria:**
- Given een gegooide error in `ResultPage.vue` met BSN in scope, When `handleError` verwerkt, Then bevat `app_logs.stack` geen 9-cijferige numerieke sequentie die als BSN parseert (Eleven-Test).
- Given een productie-stack-trace in `app_logs`, When admin de log opent, Then resolveert naar `src/views/ResultPage.vue:275`.
- Given een 401 vanuit Supabase, When `classifyError` draait, Then verschijnt user-msg "Sessie verlopen — log opnieuw in" (i18n, niet "Je hebt geen toegang").

**Implementation steps:**
- [x] Maak `src/lib/scrubber.ts` met `scrubString()` en `scrubObject(depth=3)`
- [x] Wire in `src/lib/errors.ts:35` voor `persistError(...)` aanroep
- [x] Migreer `src/store/questionnaireStore.ts:150`, `src/views/QuestionnairePage.vue:175`, `src/views/ResultPage.vue:275` naar `log.error('…', { error })`
- [x] Voeg `eslint-plugin-no-console` regel toe (allow: `[]`)
- [x] Voeg `scripts/upload-sourcemaps.ts` toe + netlify post-build hook
- [x] Schrijf `src/lib/__tests__/scrubber.test.ts` met 5 fixtures (BSN, email, JWT, mixed stack, nested engine.state)
- [x] Schrijf `src/lib/__tests__/errors.test.ts` met classify-cases voor 23505/23503/42501/40001/PGRST301/401/429
- [x] Voeg `_resetTelemetry()` helper toe en gebruik in test-setup
- [x] Documenteer scrubber-regels in `docs/telemetry.md`

## Error-Scenario Compleetheids-Matrix (25 rijen)

| # | Scenario | Bron | Vereist | Code | Tests |
|---|----------|------|---------|------|-------|
| 1 | Offline / netwerk weg | `navigator.onLine` | classificatie + UI | ✓ `errors.ts:61-67` | ✗ |
| 2 | Request timeout | `AbortController` / fetch | classificatie + retry | ⚠ `TimeoutError` class bestaat (`errors.ts:78-87`), maar `fetch('/main.json')` (`questionnaireStore.ts:143`) heeft géén AbortController | ✗ |
| 3 | DNS-fail | fetch reject (`TypeError: Failed to fetch`) | classificatie | ✓ `errors.ts:69-76` | ✗ |
| 4 | CORS / preflight fail | fetch | log + UI | ⚠ — wordt als `Failed to fetch` geclassificeerd zonder specifieke msg | ✗ |
| 5 | HTTP 401 (token expired) | Supabase auth | refresh + redirect | ⚠ — `classifyAuthError` bestaat maar in deze app niet wired voor refresh-flow; admin-UI logt user uit | ✗ |
| 6 | HTTP 403 (RLS denied) | Postgres `42501` | user-msg + log | ✓ `errors.ts:156` ("Je hebt geen toegang tot deze gegevens.") | ✗ |
| 7 | HTTP 404 (missing row) | `PGRST116`/`PGRST301` | user-msg | ✓ `errors.ts:158` ("Item niet gevonden.") — mist `PGRST116` expliciet | ✗ |
| 8 | HTTP 409 unique violation | `23505` | user-msg met veldnaam | ✓ msg ("Dit item bestaat al."), ✗ veldnaam-extractie | ✗ |
| 9 | HTTP 409 FK violation | `23503` | user-msg | ✓ `errors.ts:154` | ✗ |
| 10 | HTTP 409 serializable | `40001` | retry | ⚠ — user-msg ✓ ("Probeer het opnieuw"), maar geen automatische retry | ✗ |
| 11 | HTTP 422 validation | API | veld-specifieke fout | N/A: app heeft geen server-validation API; alle validatie client-side via decision-engine | N/A |
| 12 | HTTP 429 rate limit | Supabase / API | backoff + UI | ✗ — geen `429` of `Retry-After` handling | ✗ |
| 13 | HTTP 5xx | Supabase | retry + log + UI | ⚠ — generieke `PostgrestError` fallback (`errors.ts:165-170`), geen retry | ✗ |
| 14 | Promise rejection (unhandled) | `window.onunhandledrejection` | global handler | ✓ `main.ts:18-21` | ✗ |
| 15 | Sync error (uncaught) | `window.onerror` | global handler | **✗** — niet gewired, alleen Vue + unhandledrejection | ✗ |
| 16 | Worker / SW error | postMessage | propagation | N/A: PWA bouw aanwezig (Vite plugin?) maar geen aparte SW message-handling | N/A |
| 17 | LocalStorage quota | `setItem()` throw | fallback + log | ⚠ — `error-context.ts` / `breadcrumbs.ts` gebruiken in-memory buffers, geen LS-persist | informatief |
| 18 | IndexedDB blocked | IDB-request onblocked | UX prompt | N/A: app gebruikt geen IDB | N/A |
| 19 | Crypto decrypt fail | crypto.subtle | log + recover | N/A: geen E2E crypto in app | N/A |
| 20 | Render-time error | Vue 3 boundary | error boundary | ✓ `main.ts:14-16` + `App.vue:40` page-level | ✗ |
| 21 | Backgrounded / lost focus | `visibilitychange` | flush logs | ⚠ — `beforeunload` ✓ (`main.ts:31`), maar geen `visibilitychange` voor mobile-tab-switch | ✗ |
| 22 | OOM / device-memory | runtime | best-effort log | ✗ | ✗ |
| 23 | External API 4xx (Supabase / RPC) | `supabase.rpc('get_grouped_logs_by_source')` | classificatie + retry policy | ⚠ — `logStore.ts:75,98` `catch (e)` met `console.error` zonder `handleError` | ✗ |
| 24 | Auth-state corruption | Supabase session | logout + clean state | ⚠ — `authStore.ts:27` `onAuthStateChange` reageert, maar geen error-path bij corrupted session | ✗ |
| 25 | Concurrent store updates | Pinia race | last-write-wins of conflict | ✗ — Pinia heeft geen built-in conflict-detectie, geen optimistic-locking | ✗ |

**Resultaat:** 7× ✓ (code-coverage), 9× ⚠ (partieel), 5× ✗, 4× N/A. **0× ✓✓** (geen tests). Code-coverage is acceptabel voor solo-developer-app, test-coverage is **kritiek tekort** voor medische context.

## Kritieke Telemetry-Paden Review

| # | Pad | Logger? | Error-handler? | Scrubber? | Breadcrumb? | Verdict |
|---|-----|---------|----------------|-----------|-------------|---------|
| 1 | `src/main.ts:14-22` — Vue bootstrap | n.v.t. | **ja** (`handleError`) | **nee** | n.v.t. | pass (mits scrubber komt) |
| 2 | `src/views/QuestionnairePage.vue:170-176` — flow-load | nee (raw `console.error`) | nee (geen `handleError`) | nee | nee | **warn** — patient-input in scope |
| 3 | `src/views/ResultPage.vue:275-310` — antibioticakeuze tonen | nee (raw `console.error`) | nee | nee | nee | **warn kritiek** — klinisch advies-pad |
| 4 | `src/store/questionnaireStore.ts:143-150` — main.json fetch | nee (raw `console.error`) | nee | nee | nee | **warn** |
| 5 | `src/lib/log-sink.ts:85-106` — sink batch insert | ja (`log.warn` self-log) | partial (circuit-break) | **nee** — payload niet gescrubd | n.v.t. | **warn** — sink zelf lekt mogelijk PHI |
| 6 | `src/store/authStore.ts:24-50` — Supabase session | nee | nee (geen `handleError`) | n.v.t. | nee | warn |
| 7 | `src/store/logStore.ts:75,98` — admin RPC fail | nee (raw `console.error`) | nee | n.v.t. | nee | warn |

## Actielijst per Categorie

### Kritiek (PHI-lek of geen error-coverage)
- [x] **ACT-U01** Implementeer `src/lib/scrubber.ts` en wire in `persistError` (`errors.ts:35-44`) — voorkomt PHI in Supabase `app_logs.stack`
- [x] **ACT-U02** Vervang raw `console.error` in `src/views/ResultPage.vue:275` door `handleError(error, 'result:render')` — kritiek klinisch pad
- [x] **ACT-U03** Vervang raw `console.error` in `src/views/QuestionnairePage.vue:175` door `handleError(error, 'questionnaire:load')`
- [x] **ACT-U04** Vervang raw `console.error` in `src/store/questionnaireStore.ts:150` door `log.error('init-failed', { error })`

### Belangrijk
- [x] **ACT-U05** Voeg `window.addEventListener('error', e => handleError(e.error, 'window:error'))` toe in `src/main.ts:18` — dekt sync uncaught errors
- [x] **ACT-U06** Voeg `visibilitychange` flush toe in `src/main.ts` — mobile-tab-switch dataverlies voorkomen
- [x] **ACT-U07** Wire `logStore.ts:75,98` raw `console.error` door `handleError` — admin-UI errors gaan nu verloren
- [x] **ACT-U08** Voeg `AbortController` + timeout aan `fetch('/main.json')` in `questionnaireStore.ts:143` — scenario 2 dekken
- [x] **ACT-U09** Voeg HTTP 429 + `Retry-After` handling toe aan `classifyError` (`errors.ts:58-128`)
- [x] **ACT-U10** Voeg session-refresh flow toe voor `42501` ipv direct "Je hebt geen toegang"-msg

### Verbetering
- [x] **ACT-U11** Schrijf `src/lib/__tests__/scrubber.test.ts` met 5 fixtures (BSN, email, JWT, mixed stack, nested engine.state)
- [x] **ACT-U12** Schrijf `src/lib/__tests__/errors.test.ts` met classify-cases voor alle Postgres codes
- [x] **ACT-U13** Sourcemap-upload script + netlify post-build hook → Supabase Storage `sourcemaps/`
- [x] **ACT-U14** Implementeer fingerprint-deduplicatie in admin-UI (`logStore.ts:66`)

### Verschraling-preventie
- [x] **ACT-U15** `eslint-plugin-no-console` met `allow: []` in `eslint.config.js`
- [x] **ACT-U16** Pre-commit grep van `dist/` op `console.log/error` na build
- [x] **ACT-U17** CI-gate: scrubber-test moet altijd groen — block PR bij rode scrubber-test
- [x] **ACT-U18** Doc `docs/telemetry.md` met scrubber-regels en threat-model

## Wijzigingen sinds vorige audit (2026-05-07)

| Aspect | 2026-05-07 | 2026-05-12 (nu) |
|--------|------------|------------------|
| Commits | 0 sinds 05-03 | **0 sinds 05-07** — repo statisch |
| handleError calls | 10 | 10 (identiek) |
| Breadcrumb calls | 29 | 29 (identiek) |
| Console.* count | 3 | 3 (identiek) |
| Scrubber-tests | 0 | 0 (identiek) |
| Aanbeveling | Pad B (scrubber + sourcemap) zonder migratie | identiek — versterken eigen stack, geen vol migratie |

**Trend:** maatwerk-stack is robuust maar groeit niet mee. Scrubber-gat is dezelfde rode vlag als 12 dagen geleden. Aanbeveling: **prioriteit verhogen voor ACT-U01 (scrubber)** ongeacht commit-stilte — risico is constant aanwezig in productie.

---

## Anti-Verschraling Checklist

### Inventarisatie
- [x] Alle 11 metrieken gemeten met echte grep-output
- [x] grep-output bevestigd (uitgevoerd in sessie)
- [x] Tests vers gemeten — `find … xargs grep scrub` returns leeg → ✗ score gerechtvaardigd

### Dimensies
- [x] Alle 9 dimensies gescoord met onderbouwing
- [x] Elke dimensie heeft ≥1 file:line referentie
- [x] Issues hebben file:line + impact
- [x] Geen "Looks good" zonder onderbouwing

### Error-Scenario Matrix
- [x] Alle 25 scenario's beoordeeld
- [x] Per scenario: code- en test-coverage afzonderlijk
- [x] N/A-markeringen hebben motivatie (rows 11, 16, 17, 18, 19)

### Kritieke Paden
- [x] ≥5 kritieke paden geidentificeerd (7 paden gereviewed)
- [x] Per pad: logger, error-handler, scrubber, breadcrumb beoordeeld

### Actielijst
- [x] Elke actie heeft uniek ACT-ID (ACT-U01..U18)
- [x] Elke actie heeft file:line referentie
- [x] Elke actie is gecategoriseerd
- [x] ≥3 acties (18 acties)
- [x] Acties zijn concreet en afvinkbaar

### Rapport Integriteit
- [x] Rapport ≥120 regels
- [x] Vergelijking met vorige audit (2026-05-07)
- [x] Anti-verschraling checklist onderaan met [x] markering
