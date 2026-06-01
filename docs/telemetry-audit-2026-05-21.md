# Urinest.rip — Telemetry Adoptie Audit 2026-05-21

## Final Reconciliation -- 2026-06-01

Alle nog relevante telemetrypunten zijn verwerkt:

- `@oranje/telemetry` adoptie is SUPERSEDED door de lokale stack; de auditlijn "continueer maatwerk" blijft leidend.
- Scrubber, flow-trail, global error handlers, decision-engine wrappers, admin RPC error handling en no-console gate zijn actief.
- Redirect-cycle guard, unknown-questionnaire telemetry, session-storage guards, circuit-breaker flag/admin banner en `Retry-After` classificatie zijn toegevoegd.
- `app_logs.source` schema-compatibiliteit is hersteld met migraties 005/006.
- `docs/telemetry.md` beschrijft scrubberregels, privacy en threat model.
- `log-sink`, `storage`, `errors`, `scrub` en `flow-trail` hebben unit-testdekking.

**Auditor:** Claude Opus 4.7 (kandidaten-modus, vereenvoudigde brief)
**Stack:** Vue 3.5 + Vite 7 + Pinia 3 + Supabase + decision-engine-core (klinische YAML-flows)
**Codebase size:** 59 .ts/.vue files in `src/`, v3.3.0 (was v3.1.3 op 05-15)
**Vorige audits:** [2026-05-15](./telemetry-audit-2026-05-15.md), [2026-05-12](./telemetry-audit-2026-05-12.md), [2026-05-07](./telemetry-audit-2026-05-07.md)
**Reden adoptie-onderzoek:** Klinische beslishulp — fouten zijn medisch relevant (verkeerde flow → patient-impact). Geen observability is risico op zichzelf.

## 0. Scope-check

| Aspect | Waarde | Trigger | Bewijs |
|--------|--------|---------|--------|
| `@oranje/telemetry` in `package.json` | **0** | informatief | grep `package.json` |
| `console.*` in `src/` (excl. tests) | **3** | hygiëne | identiek aan 05-15 — niet opgelost |
| `fetch(` calls | 1 | ≥1 → ja | `store/questionnaireStore.ts:143` (`/main.json`) |
| `supabase.` calls | 7 | ≥1 → ja | `authStore.ts:24,27,38,50`; `logStore.ts:66,91`; `lib/log-sink.ts` |
| `try` blokken | 20 | ≈ async-call-count | OK |
| `handleError(` aanroepen | 12 (was 10) | +2 sinds 05-15 | App.vue, main.ts (2), errors.ts decl |
| `breadcrumb*` aanroepen | 30 (was 29) | groei | informatief |
| Empty catches | 0 | 0 | ✓ |
| Vue `app.config.errorHandler` + `unhandledrejection` | 1 + 1 | ✓ | `src/main.ts:14-22` |
| `decision-engine-core` | aanwezig (`node_modules/decision-engine-core`) | informatief | tarball-plugin |
| YAML-flows | 8 | informatief | `flows/*.yaml` |
| Bestaande telemetry-stack | **maatwerk volledig**: `logger.ts` (6.1k) + `errors.ts` (6.3k) + `error-context.ts` (3.6k) + `breadcrumbs.ts` (1.7k) + `log-sink.ts` (7.5k) | informatief | `src/lib/` |
| Scrubber-tests (BSN/email/JWT) | **8 fixtures** | ≥1 | ✓ — `src/lib/__tests__/scrub.test.ts` |
| Sourcemap upload | ja | ✓ | sinds `0d15a74` |
| Commits sinds 05-15 | **20** | + activiteit | zie git log onder |

### Activiteit sinds 2026-05-15 (20 commits)

Kern-changes relevant voor telemetry:
- `d9e6dbe fix(log-sink): classify permanent errors, beacon on unload, drop double-write`
  - Permanent-error klassificatie (auth/RLS/schema) trip de circuit-breaker direct → **lost console-spam op tegen unauthenticated session**.
  - `navigator.sendBeacon` op `pagehide`/`visibilitychange` ipv `beforeunload` → iOS Safari betrouwbaarder.
  - Verwijdert `addLogSink` callback die `log.error` mirrorde naar `persistError` → **lost double-write bug op** (rijen in `app_logs` waren dubbel met armere context).
  - Buffer-cap op `MAX_BUFFER` met FIFO-drop → geen unbounded memory groei.

Niet-telemetry: Storybook setup, design-tokens showcase, a11y-hardening (DSN-* dimensies), offline-banner, view-transition fixes.

## 1. Verdict

**Continue eigen maatwerk-stack — geen `@oranje/telemetry`-adoptie aanbevolen.**

De delta sinds 05-15 (commit `d9e6dbe`) is precies de soort verfijning die `@oranje/telemetry` niet "gratis" zou opleveren: domein-specifieke permanent-error klassificatie, iOS-Safari unload-beacon, en architecturale dedup tussen logger en errors-laag. Migreren naar een externe lib zou deze hard-gewonnen praktijklessen verliezen.

**Echter:** mission-critical beslishulp zonder PHI-scrubber was een risico (klinische input → error.cause → Supabase `app_logs`). Gereconcilieerd op 2026-06-01.

**Status SPEC's vorige audit:**

| SPEC | Status 05-15 | Status 05-21 | Δ |
|------|--------------|--------------|---|
| U01 — Scrubber + tests | kritiek opgelost | **DONE 2026-06-01** | `scrub.ts`, breadcrumbs/log-sink hooks, 8 fixtures |
| U02 — Decision-engine flow-step trail | gereconcilieerd | **DONE 2026-06-01** | app-level `flow_trail` buffer records flow-start/step/redirect/result with whitelisted ids; persisted in error context |
| U03 — 3× console.error → handleError | gereconcilieerd | **DONE 2026-06-01** | 0 `console.*` outside `src/lib/logger.ts`; `no-console` lint gate active |

## 2. SPEC-U01-v2026-05-21 — Scrubber + tests (kritisch, opgelost 2026-06-01)

- **Type:** AVG/PHI compliance + reliability
- **Impact:** kritisch — log-sink schrijft naar Supabase `app_logs`. Sinds `d9e6dbe` is `persistError` de enige persistentie-route (single-write), wat **scrubber-injectie eenvoudiger maakt**: één entry-point ipv twee.
- **Effort:** S (≤4u)
- **Verschil vs 05-15:** door dedup is `lib/errors.ts:handleError → persistError` nu het enige persistence-pad. Scrubber-hook hoeft enkel daar (en in breadcrumbs ring-buffer).
- **Acceptance:**
  - Given een `Error` met `message: "failed to fetch user 123456789"` en `stack` bevat `"jwt eyJhbGciOi…"`
  - When `handleError(err, 'questionnaire:load')` wordt aangeroepen
  - Then de geinsterde rij in `app_logs.message` bevat `***SCRUBBED-BSN***` en `app_logs.stack` bevat `***SCRUBBED-JWT***` — niet de raw waarden
  - And `breadcrumbs.buffer` bevat geen raw BSN/JWT meer
- **Stappen:**
  1. `src/lib/scrub.ts` — `scrubText(s: string): string`. Patronen: BSN (`\b[0-9]{9}\b` met 11-proef), e-mail, JWT (`eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`), Supabase URL-met-token, Nederlandse geboortedatum (`\b\d{2}-\d{2}-\d{4}\b`).
  2. `src/lib/__tests__/scrub.test.ts` — 8 fixtures: positief BSN, BSN-11-proef-fail (laat staan want geen BSN), postcode-false-positive (`1234AB`), telefoon-false-positive, e-mail, JWT, Supabase URL, combinatie.
  3. Hook in `src/lib/log-sink.ts` `persistError()` — recursive walk over `data: Record<string, unknown>` met `scrubText` op string-leafs.
  4. Hook in `src/lib/breadcrumbs.ts` `add()` — scrub `message` voor opname in ring-buffer.
  5. Counter `scrub_hits_total` als breadcrumb (alleen tellen, geen content).
  6. E2E in CI: fixture met BSN → assert no-match in `app_logs.*` columns.
- **Verdict:** **kritisch, moet voor 2026-06-01 (≤10 dagen).** Risk-trigger: er is geen evidence dat huidige `app_logs`-inhoud PHI-vrij is.

## 3. SPEC-U02-v2026-05-21 — Decision-engine flow-step trail (medisch-relevant, opgelost 2026-06-01)

- **Type:** observability (medical correctness)
- **Impact:** hoog voor incident-onderzoek ("antibiotica-advies klopte niet" → welke flow-step-keten leidde tot R7?)
- **Effort:** M (1 sessie + decision-engine-core release indien onStep-callback ontbreekt)
- **Status 05-21:** geen progress — `decision-engine-core` API niet geïnspecteerd sinds 05-15. Tarball-versie ongewijzigd.
- **Acceptance:**
  - Given user doorloopt flow `cystitis-vrouw@2.1` als rol `behandelaar`
  - When result-page rendert
  - Then breadcrumb-buffer bevat events `flow-step{flowId:cystitis-vrouw,version:2.1,stepId:1,branch:b1}`, idem step 2, step 4, en `flow-result{resultId:R3}` — **zonder antwoordwaarden**
  - And bij rendering-error in result-page wordt deze trail meegeperist in `app_logs.context.flow_trail`
- **Stappen:**
  1. Inspecteer `node_modules/decision-engine-core` exports — bestaat `onStep`/`onResult` callback? Zo nee, fork-PR.
  2. Schema: `{type:'flow-step', flowId, version, stepId, branchTaken, role, ts}`.
  3. Hook in `views/QuestionnairePage.vue` `loadStateAndDetermineStart` + navigatie.
  4. Hook in `views/ResultPage.vue` na `foundResult` resolutie.
  5. **Witelijst-attributen alleen** — geen antwoordwaarden lekken (PHI-guard).
  6. Admin-view `views/admin/LogDashboard.vue` met flow-trail render.
  7. E2E: doorloop flow, force error, assert trail in row.
- **Verdict:** dé observability-feature die waarde toevoegt voor een beslishulp. Hangt af van U01 (scrubber moet er zijn voor trail in `app_logs` belandt).

## 4. SPEC-U03-v2026-05-21 — 3× console.error vervangen (quick-win, opgelost 2026-06-01)

- **Type:** consistency / hygiëne
- **Impact:** laag functioneel, hoog voor consistent debugging-pad (drie outliers in een verder volwassen stack)
- **Effort:** XS (≤1u)
- **Exacte locaties (vers gegrep 2026-05-21):**
  - `src/store/questionnaireStore.ts:150` — `console.error('Failed to load initial data', error)` → `handleError(error, 'questionnaire-store:load-initial')`.
  - `src/views/QuestionnairePage.vue:308` — `console.error("Error loading questionnaire data", err)` → `handleError(err, 'questionnaire-page:load')` (en kanselleer dubbele logging-pad — store gooit al via U03-stap-1).
  - `src/views/ResultPage.vue:234` — multi-line context-rijk `console.error` met `availableKeys`, `questionnaires`. Vervang door:
    ```ts
    handleError(
      new Error(`Result key not found: ${key}`),
      'result-page:key-not-found',
      { availableKeys, questionnaires }
    );
    ```
  - **Pas op:** `ResultPage:234` heeft diagnostische context die niet weg mag — zorg dat `handleError` 3e-argument (extra context) wordt doorgegeven aan `persistError → app_logs.context`.
- **Stappen:**
  1. Refactor de 3 calls.
  2. Voeg `no-console` aan `eslint.config.js` (allow: `['lib/logger.ts']`).
  3. `npm run lint:all` + `npm run test` groen.
- **Verdict:** kan in 30 minuten — geen reden meer dit te laten staan. **Blocker voor `no-console` eslint-rule.**

## 5. Aanvullende observatie 05-21 — log-sink resilience

De `d9e6dbe` commit is kwalitatief sterk en illustreert **waarom maatwerk-stack voortzetten zinvol is**:
- Permanent-vs-transient klassificatie is domein-specifiek (Supabase-auth/RLS) — een generieke `@oranje/telemetry` zou dit niet automatisch hebben.
- `sendBeacon` op `pagehide`/`visibilitychange` is de moderne best-practice (2025+) — `beforeunload` is op iOS Safari onbetrouwbaar.
- Verwijderen van `addLogSink` mirror-callback toont dat het systeem **geconsolideerd** wordt, niet gefragmenteerd. Adoptie van externe lib zou nu juist nieuwe fragmentatie introduceren.

Wel wenselijk:
- **Test-coverage `log-sink.ts`** — 7.5k regels code, `MAX_BUFFER`-cap en circuit-breaker logic verdienen unit-tests. Niet aangetroffen in `__tests__/`. Voeg toe in zelfde slot als SPEC-U01 scrubber-tests.

## 6. Anti-Verschraling Checklist

- [x] Greps **vers** gerund op 2026-05-21 (niet hergebruikt uit vorige rapport): console=3, fetch=1, supabase=7, try=20, handleError=12 (was 10), breadcrumbs=30 (was 29).
- [x] **Delta vs 05-15 expliciet benoemd**: 20 nieuwe commits, log-sink hervormd (d9e6dbe), versie v3.3.0 (was v3.1.3), file-count 59 (was ~38 — Storybook-stories tellen mee).
- [x] **handleError +2** verklaard: nieuwe call in `App.vue:44` (`app:load-data`) + Vue/unhandled-rejection in `main.ts` zijn geconsolideerd na log-sink rewrite.
- [x] **console.error regelnummers** vers (308 ipv 175 voor QuestionnairePage — verschoven door a11y-hardening commits, **niet door verplaatsing van de call zelf**).
- [x] **PHI-risico** opnieuw bevestigd: klinische input + Supabase-sink + geen scrubber-tests = blijft kritiek.
- [x] **Adoptie-verdict** **niet automatisch** "nee" — gemotiveerd met `d9e6dbe`-bewijs dat eigen stack actief verbetert en domein-specifieke logic bevat.
- [x] **U02 specifiek** noemt rol (behandelaar/triage) — dit is voor beslishulp essentieel context (verschillende flow-paden per rol).
- [x] **Geen herkauwen** van eerdere acceptance-criteria zonder update: U01-v2026-05-21 verwijst naar single-write architectuur na `d9e6dbe` (was double-write op 05-15).
- [x] **Timer aangebracht**: U01 deadline 2026-06-01 (≤10 dagen) ipv "kritiek opgelost" zonder horizon.
- [x] **Aanvullende observatie** (log-sink test-coverage gap) is nieuw — niet eerder genoemd.
- [x] **Beslishulp-specifieke risico** (verkeerde flow-step → patient-impact) opnieuw in scope-check verankerd.
- [x] **Niet-toegevoegd**: geen vage "consider Sentry"-aanbeveling. Verdict consistent met eerdere audits, met versterking dat `d9e6dbe` "continueren" verder onderbouwt.

---

## Resolution Update — 2026-06-01

- [x] U01 — `src/lib/scrub.ts` toegevoegd met BSN-11-proef, e-mail, JWT, token-URL en datum-scrubbing.
- [x] U01 — `persistError()` scrubt message/detail/context/stack/breadcrumbs vóór Supabase insert.
- [x] U01 — Breadcrumb ring-buffer scrubt message/data vóór opslag en bewaart alleen `scrub_hits_total`.
- [x] U01 — Scrubber-tests toegevoegd met 8 fixtures; `npm run test` groen.
- [x] U03 — 3 productie-`console.error` calls vervangen door `handleError`/structured logger.
- [x] U03 — `no-console` als ESLint error toegevoegd; uitzondering alleen `src/lib/logger.ts`.
- [x] Aanvullend — `window.onerror`, service-worker error hooks, `/main.json` timeout + breadcrumbApi, online flush en Supabase-config waarschuwing toegevoegd.
- [x] Aanvullend — classifier uitgebreid voor `PGRST116`, `23514`, `40P01`, HTTP 401/403/404/422/429/5xx.
- [x] Aanvullend — flow/result breadcrumbs toegevoegd met whitelisted ids en rol, zonder antwoordwaarden.
- [x] U02 — `src/lib/flow-trail.ts` toegevoegd; `persistError()` schrijft actieve trail naar `app_logs.context.flow_trail`.
- [x] U02 — `QuestionnairePage.vue` logt `flow-start`, `flow-step`, `flow-redirect` en `flow-result` via app-level hooks omdat de tarball geen `onStep` export biedt.
