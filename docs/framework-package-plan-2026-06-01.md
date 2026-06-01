# Beslismodel Framework Package Plan — 2026-06-01

## Doel

Maak van `urinest.rip` een herbruikbaar, standalone beslismodel-framework voor medische richtlijnen en behandelprotocollen.

Primair gebruik:
- `urinest.rip`: eerste productie-app en Urinestrip test case.
- `huisarts.land`: centrale landing voor meerdere richtlijnen, vragenlijsten en protocollen.
- Nieuwe domeinen: CVRM inclusief PREVENT-risicoberekeningen, COPD, DM, ouderenzorg, triage, praktijkprotocollen.

Framework moet flow-data kunnen wisselen zonder UI/UX, runtime, telemetry, testing en design-system opnieuw te bouwen.

## Ronde 0 — Directe Bugs

- [x] `Transition was skipped` wordt niet meer als unhandled error behandeld.
- [x] Dev log-sink schrijft niet naar Supabase zonder expliciete opt-in.
- [x] Landing-tegels zijn begrensd door component scale, niet viewportbrede square cards.
- [x] Atomic commits:
  - `24e9d05 fix(telemetry): suppress dev transition noise`
  - `5190210 fix(landing): constrain questionnaire tiles`

## Huidige Score

| Domein | Huidig | Target | Belangrijkste gap |
|---|---:|---:|---|
| Architectuur | 3.2/5 | 4.8/5 | App-, store-, router- en frameworklogica zitten door elkaar |
| Package readiness | 1.5/5 | 4.8/5 | Geen exports, package boundaries, library build, consumer fixture |
| Compiler/schema | 2.5/5 | 4.9/5 | Build errors worden geslikt; random rule IDs; type drift |
| UI/UX framework | 3.0/5 | 4.8/5 | Grote page-scoped organisms; legacy `.md-*`; atomic laag incompleet |
| Design tokens | 4.0/5 | 4.8/5 | Sterke CSS tokens, geen DTCG/component-token export |
| Telemetry | 3.7/5 | 4.8/5 | Hard-coded source/app keys; package-adapter ontbreekt |
| Security/privacy | 4.0/5 | 4.8/5 | Scrubbing aanwezig, package threat model en consumer policy ontbreken |
| Testing | 4.0/5 | 4.9/5 | Goede flowtests, geen package contract/consumer/e2e visual suite |
| Performance | 4.0/5 | 4.8/5 | Supabase/admin/logging scheiding en package bundle budgets ontbreken |

## Kritieke Bevindingen Uit Agent-Ronde

- [x] Source maps uploaden naar Supabase, daarna `.map` uit `dist` verwijderen vóór Netlify deploy.
- [x] Tests niet laten afhangen van ignored/stale `public/main.json`; flow-build vóór test of tests direct uit YAML compile.
- [x] Supabase admin policies beperken tot admin claim/email allowlist, niet elke `authenticated` user.
- [x] Legacy unfiltered log RPCs droppen/revoken.
- [x] Anonymous log insert begrenzen via validated RPC/Edge Function met payload-size/rate/source checks.
- [x] Route params, result IDs, session IDs en flow trail entries hashen/redacten waar ze klinische state kunnen onthullen.
- [x] Log-sink batch requeue bij thrown flush errors.
- [x] Breaker flag bij reload lezen en persistence disabled houden.
- [x] Auth refresh failure: sign out, refresh loop stoppen, redirect naar login.
- [x] `VITE_ENABLE_LOG_PERSISTENCE` typen en documenteren.
- [x] `npm audit --omit=dev --audit-level=high` hard laten falen.
- [x] CSP/HSTS/Permissions-Policy uitbreiden in `public/_headers`.

## Package Boundaries

### `@beslismodel/core`

Pure TypeScript. Geen Vue, DOM, fetch, storage, Supabase.

- [ ] Flow manifest types
- [ ] Normalisatie van questionnaires/questions/steps/results
- [ ] Condition validation wrapper
- [ ] Graph traversal
- [x] Progress calculation
- [x] Typed outcome resolver
- [ ] Redirect-cycle detector
- [ ] Role/context injection via pure `RuntimeContext`
- [ ] CVRM/PREVENT calculator extensiepunt
- [ ] Deterministic audit trail model

### `@beslismodel/compiler`

YAML/JSON naar strict manifest.

- [ ] CLI `beslismodel build`
- [ ] Vite/Rolldown plugin
- [ ] Strict schema validation
- [ ] Build faalt hard bij schema/logica fouten
- [ ] Deterministic rule IDs
- [ ] Generated JSON schema
- [ ] Generated `.d.ts`
- [ ] Stable manifest snapshots
- [ ] Flow taxonomy metadata (`category`, `audience`, `domain`, `hiddenFromLandingPage`, `recommendedStart`)

### `@beslismodel/vue`

Vue runtime en UI.

- [ ] `createBeslismodelStore({ loadManifest, storage, contextProvider, telemetry, onError })`
- [ ] `useQuestionnaireRunner`
- [ ] `useResultResolver`
- [ ] Route helpers
- [ ] `QuestionnaireRunner`
- [ ] `ResultRenderer`
- [ ] `LandingMenuGrid`
- [ ] Slot-based result sections
- [ ] Consumer-owned labels/icons/taxonomy
- [ ] Vue, Pinia, Router als peer dependencies

### `@beslismodel/testing`

Framework test tools.

- [ ] Path enumeration
- [ ] Dead-end coverage
- [ ] Missing result checks
- [ ] Redirect target checks
- [ ] Role/context matrix runner
- [ ] Snapshot helpers
- [ ] Clinical safety fixtures
- [ ] Urinestrip testcase template

### `urinest.rip` app

App blijft eigenaar van domeindata en branding.

- [ ] YAML flows
- [ ] Urinest icons/taxonomy
- [ ] Guideline traceability
- [ ] About page
- [ ] PWA branding
- [ ] Supabase admin/log dashboard
- [ ] Clinical Dutch copy

## Architectuur Checklist

- [ ] `QuestionnairePage.vue` splitsen in runner composable + page shell + organisms.
- [ ] `ResultPage.vue` splitsen in renderer composable + `ResultSection` organisms.
- [ ] `LandingPage.vue` genereren uit manifest/taxonomy, geen hard-coded flow links.
- [ ] Store hard-coded `/main.json` vervangen door injectable loader.
- [ ] Storage keys app-configurabel maken.
- [ ] Hard-coded `urinestrip` telemetry source vervangen door app config.
- [ ] Role injection `_role` vervangen door framework context provider.
- [x] Outcome strings `redirect:x` / `result:y` vervangen door discriminated union.
- [ ] Redirect-chain logic uit page naar core/runtime.
- [ ] Markdown renderer injectable maken met sanitizer contract.
- [ ] Admin routes buiten framework houden.
- [ ] App shell en framework runner scheiden.

## Compiler Checklist

- [x] `build:flows` script toevoegen.
- [x] CI tests laten voorafgaan door flow-build.
- [x] Plugin `runBuild()` laat errors niet meer stil vallen.
- [x] Rule IDs deterministisch maken.
- [x] `Question.type` union alignen met generated `select`.
- [x] Manifest `name/title/hiddenFromLandingPage` types alignen.
- [ ] Schema controleert unknown condition operators.
- [ ] Schema controleert orphan questions.
- [ ] Schema controleert unreachable results.
- [ ] Schema controleert duplicate option values.
- [ ] Schema controleert missing guideline/source metadata waar verplicht.

## UI/UX En Atomic Design Checklist

### Atoms

- [x] `Button`
- [x] `Card`
- [x] `Badge`
- [x] `Icon`
- [x] `Skeleton`
- [x] `ProgressBar`
- [x] `BackButton`
- [ ] `IconButton`
- [ ] `Input`
- [ ] `Select`
- [ ] `Checkbox`
- [ ] `Radio`
- [ ] `Tooltip`

### Molecules

- [ ] `SegmentedControl` voor role/theme/admin filters
- [ ] `FormField`
- [ ] `ChoiceOption`
- [ ] `ChoiceGroup`
- [ ] `InfoPopover`
- [ ] `Notice`
- [ ] `StatusBadge`
- [ ] `SourceChip`
- [ ] `CopyAction`

### Organisms

- [ ] `AppHeader`
- [ ] `LandingMenuGrid`
- [ ] `QuestionPanel`
- [ ] `QuestionToolbar`
- [ ] `ResultSectionList`
- [ ] `DocumentationCopyPanel`
- [ ] `ContraindicationGate`
- [ ] `AdminLogList`
- [ ] `AdminLogDetail`

### Templates

- [ ] `PageShell`
- [ ] `QuestionnaireTemplate`
- [ ] `ResultTemplate`
- [ ] `AdminTemplate`
- [ ] `LandingTemplate`

### Design System Rules

- [ ] Legacy `.md-button`, `.md-card`, `.md-tile` verwijderen of quarantainen.
- [ ] Page-local badge/button/form styles vervangen door primitives.
- [ ] Header controls naar shared `SegmentedControl`.
- [ ] Alle touch targets minimaal 44px/48dp.
- [ ] Geen `transition: all`.
- [ ] Motion utilities in `motion.css`.
- [ ] Reduced motion per utility, niet alleen global catch-all.
- [ ] Storybook voor atoms, molecules, organisms, templates.
- [ ] Route-level visual regression voor landing/questionnaire/result/admin.

## Telemetry Checklist

- [x] PHI/PII scrubber aanwezig.
- [x] Flow trail aanwezig.
- [x] Global window/rejection handlers aanwezig.
- [x] Dev persistence opt-in gemaakt.
- [ ] Framework telemetry adapter interface.
- [ ] App-specific source/config injecteerbaar.
- [ ] No-op telemetry adapter voor packages.
- [ ] Supabase adapter apart package/app-only houden.
- [ ] Error classification delen tussen app en package.
- [ ] Breadcrumb model typed maken.
- [x] Log persistence tests voor 401/403/429/5xx/offline.
- [x] Flush throw-path requeue test.
- [x] Breaker reload behavior test.
- [x] Explicit dev persistence enable test.
- [ ] User-facing errorcopy per domein configureerbaar.
- [ ] Sourcemap/upload docs voor consumers.

## Security En Privacy Checklist

- [ ] Threat model voor framework package.
- [ ] No PHI in telemetry contract.
- [ ] No PHI in storage contract.
- [ ] Storage TTL en keys configureerbaar.
- [ ] CSP guidance voor consumer apps.
- [ ] Sanitizer contract verplicht voor markdown/html.
- [ ] Dependency audit in package CI.
- [ ] Secret scanning in CI.
- [ ] RLS/admin dashboard blijft app-only.
- [x] Admin RLS gebruikt claim/email allowlist.
- [x] Log ingestion gebruikt RPC/Edge Function met schema/rate/source validatie.
- [x] `.map` files niet publiek deployen.
- [ ] Security tests voor malicious flow metadata.

## Testing Checklist

- [x] Current full suite groen: 20 files, 113 tests.
- [x] Flow dead-end tests bestaan.
- [x] Progress tests bestaan.
- [x] Telemetry scrub/log-sink tests bestaan.
- [x] `build:flows` vóór tests in CI.
- [x] Flow tests gebruiken verse compiled output.
- [x] Package unit tests per package.
- [ ] Consumer fixture app.
- [ ] Urinestrip fixture e2e: nitriet positief redirect naar bacteriurie.
- [ ] Urinestrip fixture e2e: nitriet negatief + leuko positief redirect naar leukocyturie.
- [ ] Urinestrip fixture e2e: alles negatief toont no-conclusive-abnormality.
- [ ] Role/context matrix tests.
- [ ] Accessibility route tests.
- [ ] Visual regression voor critical UI.
- [ ] Mutation testing pilot voor core traversal/outcome resolver.
- [ ] Bundle budget per package.

## Performance Checklist

- [ ] Core package zero DOM/framework dependencies.
- [ ] Vue package tree-shakeable exports.
- [ ] Admin/Supabase lazy app-only.
- [ ] Markdown renderer lazy or injectable.
- [ ] Manifest load cache strategy configurable.
- [ ] Route prefetch opt-in.
- [ ] Bundle budget package en app.
- [ ] Lighthouse CI landing/questionnaire/result.
- [ ] No layout shift from SVG/menu tiles.
- [x] Source maps buiten public deploy artifact houden.

## Urinestrip Test Case

Urinestrip wordt eerste end-to-end package fixture.

- [ ] Compile `flows/strip.yaml` via strict compiler.
- [ ] Load manifest through injected loader.
- [ ] Render landing from manifest taxonomy.
- [ ] Run questionnaire through framework runner.
- [ ] `nitrite == positive` gives typed redirect outcome `{ type: "redirect", target: "bacteriurie" }`.
- [ ] `nitrite == negative`, `leukocytes == positive` redirects to `leukocyturie`.
- [ ] `nitrite == negative`, `leukocytes == negative`, `erythrocytes == positive` redirects to `hematurie`.
- [ ] All negative gives typed result outcome.
- [ ] Progress indicator correct through all branches.
- [ ] Telemetry records flow start, step, redirect/result without PHI.
- [ ] Accessibility: keyboard, screenreader label, focus order.

## Multi-Agent Rondes

### Ronde 1 — Foundations

- Agent A: compiler/schema/CI.
- Agent B: core runtime extraction.
- Agent C: design-system atomic split.
- Agent D: telemetry/testing/security.

Exit criteria:
- [ ] `build:flows` strict.
- [x] `@beslismodel/core` scaffold.
- [x] Typed outcome model.
- [x] Urinestrip tests still green.

### Ronde 2 — Vue Runtime

- [ ] Store factory.
- [ ] Runner composable.
- [ ] Questionnaire organism.
- [ ] Result renderer organism.
- [ ] Landing generated from manifest.

### Ronde 3 — Design System

- [ ] Atoms/molecules completed.
- [ ] Legacy `.md-*` removed from app pages.
- [ ] Storybook expanded.
- [ ] Motion system centralized.

### Ronde 4 — Telemetry/Security

- [ ] Adapter interface.
- [ ] Supabase app adapter.
- [ ] Error matrix tests.
- [ ] Threat model doc.

### Ronde 5 — Package Build

- [x] Exports/files/declarations.
- [x] Library build via Rolldown/Vite.
- [ ] Consumer fixture app.
- [ ] CI matrix.
- [ ] Versioning strategy.

## Commit Discipline

Elke stap krijgt atomic conventional commit.

Examples:
- `fix(compiler): fail build on invalid flow`
- `feat(core): add typed outcome resolver`
- `refactor(questionnaire): extract runner composable`
- `feat(design): add segmented control primitive`
- `test(framework): add urinestrip fixture paths`
- `docs(framework): document package extraction plan`

## Done Criteria

- [ ] Alle checklistitems hierboven afgevinkt of vervangen door concreter item.
- [ ] Urinestrip fixture werkt als package consumer.
- [ ] `npm run test`, `npm run check`, `npm run check:tsgo`, `npm run lint:all`, `npm run format:check`, `npm run build` groen.
- [x] CI bouwt flows vóór tests.
- [x] Geen unhandled benign browser transitions.
- [x] Geen dev Supabase 401 noise zonder opt-in.
- [ ] Landing/questionnaire/result/admin a11y pass.
- [x] Package exports bruikbaar in extern project.
