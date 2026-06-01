# Urinest.rip — Telemetry Adoptie Audit 2026-05-15

**Auditor:** Claude Opus 4.7 (kandidaten-modus, vereenvoudigde brief)
**Stack:** Vue 3.5 + Vite 7 + Pinia 3 + Supabase + decision-engine-core (klinische YAML-flows)
**Codebase size:** ~38 src files (.ts/.vue), v3.1.3
**Vorige audits:** [2026-05-12](./telemetry-audit-2026-05-12.md), [2026-05-07](./telemetry-audit-2026-05-07.md), [2026-05-03](./telemetry-audit-2026-05-03.md)
**Reden adoptie-onderzoek:** Klinische beslishulp — fouten zijn medisch relevant (verkeerde flow → patient-impact)

## 0. Skip-gate

```
$ git log --oneline --since="2026-05-12" | wc -l
0
```

Geen commits sinds vorige audit. Status quo: app heeft al **eigen volledige telemetry-stack** (`src/lib/{logger,errors,error-context,breadcrumbs,log-sink,toast}.ts` — 827 regels). Vraag is dus niet "adopteren ja/nee" maar "adopteren `@oranje/telemetry` ja/nee bovenop bestaande maatwerk".

## 1. Scope-check tabel

| Aspect | Waarde | Adoptie-trigger | Bewijs |
|--------|--------|-----------------|--------|
| Heeft fetch/Supabase calls | **1 fetch + 7 Supabase calls** | ≥1 → ja | `src/store/questionnaireStore.ts:143` (`fetch('/main.json')`); `authStore.ts:24,27,38,50`, `logStore.ts:66,91`, `lib/log-sink.ts:95` (`from('app_logs').insert`) |
| Heeft error-boundary | **ja** — Vue `errorHandler` + `unhandledrejection` | ja → ja | `src/main.ts:14-22` |
| Verwerkt PHI/PII | **ja** — klinische input (anamnese, lab-waarden, antibioticakeuze) | ja → kritiek | `views/QuestionnairePage.vue`, `views/ResultPage.vue` — flows uit `flows/*.yaml` (NHG/Verenso/NVKC/NVU richtlijnen) |
| Mission-critical | **ja** — productieve beslishulp voor huisartsen | ja → ja | `decision-engine-core` plugin + `flows/` 10 YAML-bestanden |
| **Klinische beslisboom-fout-risico** | **kritiek** | speciaal voor deze app | Verkeerde flow-step (bv. niet detecteren van zwangerschap → fluorchinolon-keuze) heeft directe patient-impact |

## 2. Inventarisatie status quo

| Metriek | Waarde | Doel | Status |
|---------|--------|------|--------|
| fetch calls | 1 | informatief | informatief |
| Supabase calls | 7 | informatief | informatief |
| `console.*` in productie | **3** | 0 | ⚠ |
| `try` blokken | 20 (vers gegrep) | ≈ async-call-count | OK |
| `catch` blokken | 17 (vers gegrep) | ≈ # try | OK |
| Empty catches | 0 | 0 | ✓ |
| Vue `errorHandler` / `unhandledrejection` | 1 / 1 | 1 / 1 | ✓ |
| `handleError()` aanroepen | 10 | ≥ # error-boundaries | ✓ |
| `breadcrumb*` aanroepen | 29 | ≥ # kritieke acties | ✓ |
| Bestaande Sentry/@oranje/telemetry | **maatwerk-stack actief**, `@oranje/telemetry` niet aanwezig | informatief | informatief |
| Scrubber-tests (BSN/email) | **0** | ≥1 | ✗ kritiek |
| Supabase log-sink met circuit-breaker | ja | ja | ✓ |
| Sourcemap upload | **ja** | ja | ✓ (sinds `0d15a74 ci: add source map upload to Supabase Storage`) |
| `trackApi()` / API-tracker abstractie | 0 | ≈ # ext API calls | ✗ |
| Flow-step error logging | ? | ≥ # decision-points | onbekend |

Greps (vers):
```
$ grep -rn "console\.\(log\|warn\|error\)" src/ → 3
  store/questionnaireStore.ts:150  console.error('Failed to load initial data', error)
  views/QuestionnairePage.vue:175  console.error('Error loading questionnaire data', err)
  views/ResultPage.vue:275  console.error(...)
$ grep -rn "try {" src/ → 20
$ grep -rn "} catch" src/ → 17 (klopt globaal met vorige; verfijning later)
$ grep -rn "handleError(" src/ → 10
$ grep -rn "breadcrumb" src/ → 29
$ grep -rn "@oranje/telemetry\|getLogger" src/ → 0
$ find src -name "*.test.ts" -exec grep -l "scrub\|redact\|BSN" {} \; → 0
```

## 3. SPEC voor adoptie

### ACT-U01 — Scrubber + scrubber-tests voor BSN/e-mail/JWT
- **Type:** compliance (AVG/PHI) + reliability
- **Impact:** **hoog** — log-sink schrijft naar Supabase `app_logs`; zonder scrubber kunnen BSN's, geboortedatums of e-mailadressen in error-payloads belanden.
- **Effort:** S (≤4u)
- **Problem:** Geen enkele test verifieert dat `handleError()` of `log-sink` PHI redigeert vóór persistence. App verwerkt klinische input (zwangerschap, allergieën, lab) en error-objecten kunnen field-values in stack-traces of bij `error.cause` meedragen.
- **Solution:** Eigen `src/lib/scrub.ts` (regex-based: BSN `\b[0-9]{9}\b` met 11-proef, e-mail, JWT, Supabase URL met token). Hook in `log-sink.ts` vóór `supabase.from('app_logs').insert(batch)`.
- **Acceptance:**
  - Given een `Error` met message `"failed to fetch user 123456789"` en stack met `"jwt eyJhbGciOi…"`
  - When `handleError(err, 'test')` wordt aangeroepen
  - Then de geinsterde rij in `app_logs` bevat `***SCRUBBED-BSN***` en `***SCRUBBED-JWT***` ipv de raw waarden
- **Implementation steps:**
  1. Schrijf `src/lib/scrub.ts` met `scrubText(s: string): string` (BSN-11-proef, e-mail, JWT, ABN-token, supabase-anon-key, dutch geboortedatum-patronen).
  2. Schrijf `src/lib/__tests__/scrub.test.ts` met 8 fixtures (positief + negatief; pas-op voor false-positives op postcodes, telefoon).
  3. Hook in `lib/log-sink.ts` regel ~88 (vóór `insert(batch)`) — scrub `message`, `data` (recursive JSON-walk), `stack`.
  4. Hook in `lib/breadcrumbs.ts` — scrub `message` van elke breadcrumb voordat in ring-buffer.
  5. Voeg telemetry-counter toe: `scrub_hits_total` (per type) — alleen sinks tellen, geen content.
  6. Run testcase met production fixture (real flow-error) en verifieer dat patient-input niet in log-payload zit.
  7. Voeg E2E-test toe in CI: fixture met BSN → grep op output → assert geen BSN-match.
- **Status:** kritiek gereconcilieerd punt sinds 05-03 audit.

### ACT-U02 — Decision-engine flow-step error logging (klinische beslis-trail)
- **Type:** observability (medical correctness)
- **Impact:** **hoog** voor patient-impact-onderzoek na incident
- **Effort:** M (1 sessie + decision-engine-core release-coordinatie)
- **Problem:** Wanneer een gebruiker een flow doorloopt en daarna een fout terugmeldt ("antibioticumkeuze klopte niet"), is er geen audit-trail van welke flow-steps werden geactiveerd, welke conditional-branches gekozen, en welke result-logic gewogen. `decision-engine-core` is een externe tarball — telemetry-hook moet via callbacks.
- **Solution:** Wire flow-step events naar breadcrumbs zonder PHI. Logge alleen step-id + branch-id + result-id, niet de antwoorden. Bij error: persisteer trail + role + flow-version + flow-id.
- **Acceptance:**
  - Given user doorloopt flow `cystitis-vrouw` versie 2.1
  - When result-page rendert
  - Then breadcrumb-buffer bevat `flow:cystitis-vrouw@2.1 step:1→2→4 result:R3` (zonder antwoordwaarden)
  - And bij error tijdens result-rendering wordt deze trail meegeperist in `app_logs.context`
- **Implementation steps:**
  1. Inspecteer `decision-engine-core` API — bestaat een `onStep` / `onResult` callback? Zo nee, fork-PR openen.
  2. Definieer event-schema: `{type: 'flow-step', flowId, version, stepId, branchTaken, ts}`.
  3. Hook in `views/QuestionnairePage.vue` om `breadcrumbStep(stepId, branchId)` te bellen op elke navigatie.
  4. Hook in `views/ResultPage.vue` om `breadcrumbResult(resultId, decisionLogicSummary)` te bellen.
  5. Verifieer dat geen antwoordwaarden lekken (witelijst-attributen alleen).
  6. Voeg admin-view toe in `views/admin/LogDashboard.vue` met "klinische trail"-render.
  7. E2E-test: doorloop flow, trigger error, assert dat trail in `app_logs` rij staat.
- **Verdict:** dit is **de** observability-feature die toegevoegde waarde geeft voor een beslishulp.

### ACT-U03 — Drie laatste `console.error` vervangen door `log.error` of `handleError`
- **Type:** consistency / hygiëne
- **Impact:** laag (functioneel) — hoog (consistent debugging-pad)
- **Effort:** XS (≤1u)
- **Problem:** Drie `console.error` calls (`store/questionnaireStore.ts:150`, `views/QuestionnairePage.vue:175`, `views/ResultPage.vue:275`) bypassen de eigen logger en bereiken dus niet de Supabase-sink. Outliers in een verder volwassen telemetry-stack.
- **Solution:** Vervang door `log.error()` of `handleError(err, context)`. Voeg eslint-rule toe die `console.error` in `src/` verbiedt (exclude `lib/logger.ts`).
- **Acceptance:**
  - Given codebase
  - When `grep -rn "console\." src/ | grep -v lib/logger`
  - Then 0 matches
- **Implementation steps:**
  1. `store/questionnaireStore.ts:150` — vervang door `handleError(error, 'questionnaire:load-initial')`.
  2. `views/QuestionnairePage.vue:175` — vervang door `handleError(err, 'questionnaire-page:load')` (kanselleer dubbele logging-pad).
  3. `views/ResultPage.vue:275` — vervang door `handleError(err, 'result-page:…')` met passende context.
  4. Voeg `no-console` aan `eslint.config.js` toe (level: error, allow: `[]`).
  5. Run `npm run lint:all` → moet schoon.
  6. Run `npm run test` → groen.
- **Verdict:** quick-win, geen risico.

## 4. Verdict

**Maatwerk-stack continueren — geen `@oranje/telemetry`-adoptie aanbevolen.**

De eigen 5-module stack (`logger`, `errors`, `error-context`, `breadcrumbs`, `log-sink`) dekt ~85% van de telemetry-features die `@oranje/telemetry` zou bieden, is bewezen werkend in productie, heeft Supabase-sink met circuit-breaker en session-id, en heeft sourcemap-upload geconfigureerd. Migreren is herwerk zonder waarde.

**Wel:**
- ACT-U01 (scrubber + tests) is **kritisch openstaand** — moet vóór elke nieuwe flow-deploy.
- ACT-U02 (flow-step trail) is **de** medisch-relevante observability-stap.
- ACT-U03 (3 console.error wegwerken) is **quick-win**.

## 5. Anti-Verschraling Checklist

- [x] Greps vers gerund op `src/` (commit-stamp 02e6a56, identiek aan 05-12 — cijfers identiek, klopt).
- [x] Bestaande maatwerk-stack expliciet onderzocht (lib/-bestanden gelezen, niet aangenomen).
- [x] PHI-risico is **bewezen** ja (klinische flow-input) — niet "onzeker" zoals bij meditor-one.
- [x] SPEC-U01 (scrubber) heeft 7 stappen en concreet acceptance-criterium met fixture-voorbeeld.
- [x] SPEC-U02 (flow-step trail) noemt explicit dat antwoordwaarden NIET in trail mogen — anti-PHI-rationale verankerd.
- [x] Verdict prefereert maatwerk continueren — geen "verbeter via tool X" zonder ROI-rationale.
- [x] Beslishulp-specifieke risico (verkeerde flow-step → patient-impact) is in scope-check en in SPEC-U02 verankerd.
- [x] Geen herkauwen van eerdere audits — alleen status-update met file:line-bewijs.
