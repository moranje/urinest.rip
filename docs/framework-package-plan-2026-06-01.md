# Beslismodel Framework Package Plan — 2026-06-01

## Doel

Maak van `urinest.rip` een herbruikbaar, standalone beslismodel-framework voor medische richtlijnen en behandelprotocollen.

Primair gebruik:

- `urinest.rip`: eerste productie-app en Urinestrip test case.
- `huisarts.land`: centrale landing voor meerdere richtlijnen, vragenlijsten en protocollen.
- Nieuwe domeinen als externe domeinpakketten: CVRM inclusief PREVENT-risicoberekeningen, COPD, DM, ouderenzorg, triage, praktijkprotocollen.

Framework moet flow-data kunnen wisselen zonder UI/UX, runtime, telemetry, testing en design-system opnieuw te bouwen.

## Ronde 0 — Directe Bugs

- [x] `Transition was skipped` wordt niet meer als unhandled error behandeld.
- [x] Dev log-sink schrijft niet naar Supabase zonder expliciete opt-in.
- [x] Landing-tegels zijn begrensd door component scale, niet viewportbrede square cards.
- [x] Atomic commits:
  - `24e9d05 fix(telemetry): suppress dev transition noise`
  - `5190210 fix(landing): constrain questionnaire tiles`

## Huidige Score

| Domein            | Huidig | Target | Belangrijkste gap                                                     |
| ----------------- | -----: | -----: | --------------------------------------------------------------------- |
| Architectuur      |  3.2/5 |  4.8/5 | App-, store-, router- en frameworklogica zitten door elkaar           |
| Package readiness |  1.5/5 |  4.8/5 | Geen exports, package boundaries, library build, consumer fixture     |
| Compiler/schema   |  2.5/5 |  4.9/5 | Build errors worden geslikt; random rule IDs; type drift              |
| UI/UX framework   |  3.0/5 |  4.8/5 | Grote page-scoped organisms; legacy `.md-*`; atomic laag incompleet   |
| Design tokens     |  4.0/5 |  4.8/5 | Sterke CSS tokens, geen DTCG/component-token export                   |
| Telemetry         |  3.7/5 |  4.8/5 | Hard-coded source/app keys; package-adapter ontbreekt                 |
| Security/privacy  |  4.0/5 |  4.8/5 | Scrubbing aanwezig, package threat model en consumer policy ontbreken |
| Testing           |  4.0/5 |  4.9/5 | Goede flowtests, geen package contract/consumer/e2e visual suite      |
| Performance       |  4.0/5 |  4.8/5 | Supabase/admin/logging scheiding en package bundle budgets ontbreken  |

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

- [x] Flow manifest types
- [x] Normalisatie van questionnaires/questions/steps/results
- [x] Condition validation wrapper
- [x] Graph traversal
- [x] Progress calculation
- [x] Typed outcome resolver
- [x] Redirect-cycle detector
- [x] Role/context injection via pure `RuntimeContext`
- [x] Domein-agnostisch calculator extensiecontract (`CalculatorDefinition` + `createCalculatorRegistry`)
- [x] Domein-agnostische flow-calculatorbinding: antwoorden/context/literals naar calculatorinput, calculatoroutput naar virtuele answers, outcome-logica op scoreklasse
- [x] Geen CVRM/PREVENT-specifieke calculator-API, extensiepunt of implementatie in core
- [x] Deterministic audit trail model

### Consumer/domain packages

Domeinspecifieke data, calculatorimplementaties en richtlijnadapters leven buiten core. Core levert alleen generieke contracten.

- [x] Urinestrip consumer fixture bewijst dat een consumer lokaal calculators kan registreren via publieke core exports
- [x] CVRM/U-Prevent calculatorpakket als consumer/domain package: `@beslismodel/cvrm-prevent` met SCORE2, SCORE2-OP en SCORE2-Diabetes uit labbie + U-Prevent testvectors; AHA PREVENT-equations nog niet aanwezig in labbie-data
- [ ] COPD calculatorpakket als consumer/domain package
- [ ] DM calculatorpakket als consumer/domain package

### `@beslismodel/compiler`

YAML/JSON naar strict manifest.

- [x] CLI `beslismodel build`
- [x] Vite/Rolldown plugin
- [x] Strict schema validation
- [x] Build faalt hard bij schema/logica fouten
- [x] Deterministic rule IDs
- [x] Generated JSON schema
- [x] Generated `.d.ts`
- [x] Stable manifest snapshots
- [x] Flow taxonomy metadata (`category`, `audience`, `domain`, `hiddenFromLandingPage`, `recommendedStart`)

### `@beslismodel/vue`

Vue runtime en UI.

- [x] `createBeslismodelStore({ loadManifest, storage, contextProvider, telemetry, onError })`
- [x] `useQuestionnaireRunner`
- [x] Gegroepeerde multi-input stappen via `step.metadata.inputMode: group`, inclusief headless slot-API voor externe apps
- [x] `useResultResolver`
- [x] Route helpers
- [x] `QuestionnaireRunner`
- [x] `ResultRenderer`
- [x] `LandingMenuGrid`
- [x] Slot-based result sections
- [x] Consumer-owned labels/icons/taxonomy
- [x] Vue, Pinia, Router als peer dependencies

### `@beslismodel/testing`

Framework test tools.

- [x] Path enumeration
- [x] Dead-end coverage
- [x] Missing result checks
- [x] Redirect target checks
- [x] Role/context matrix runner
- [x] Snapshot helpers
- [x] Clinical safety fixtures
- [x] Urinestrip testcase template

### `urinest.rip` app

App blijft eigenaar van domeindata en branding.

- [x] YAML flows
- [x] Urinest icons/taxonomy
- [x] Guideline traceability
- [x] About page
- [x] PWA branding
- [x] Supabase admin/log dashboard
- [x] Clinical Dutch copy

## Architectuur Checklist

- [x] `QuestionnairePage.vue` splitsen in runner composable + page shell + organisms.
- [x] `ResultPage.vue` splitsen in renderer composable + `ResultSection` organisms.
- [x] `LandingPage.vue` genereren uit manifest/taxonomy, geen hard-coded flow links.
- [x] Store hard-coded `/main.json` vervangen door injectable loader.
- [x] Storage keys app-configurabel maken.
- [x] Hard-coded `urinestrip` telemetry source vervangen door app config.
- [x] Role injection `_role` vervangen door framework context provider.
- [x] Outcome strings `redirect:x` / `result:y` vervangen door discriminated union.
- [x] Redirect-chain logic uit page naar core/runtime.
- [x] Markdown renderer injectable maken met sanitizer contract.
- [x] Admin routes buiten framework houden.
- [x] App shell en framework runner scheiden.

## Compiler Checklist

- [x] `build:flows` script toevoegen.
- [x] CI tests laten voorafgaan door flow-build.
- [x] Plugin `runBuild()` laat errors niet meer stil vallen.
- [x] Rule IDs deterministisch maken.
- [x] `Question.type` union alignen met generated `select`.
- [x] Manifest `name/title/hiddenFromLandingPage` types alignen.
- [x] Schema controleert unknown condition operators.
- [x] Schema controleert orphan questions.
- [x] Schema controleert unreachable results.
- [x] Schema controleert duplicate option values.
- [x] Schema controleert missing guideline/source metadata waar verplicht.
- [x] AI authoring-guide voor bronverdediging, vraagverdediging, info-knoppen, rolmatrix, telemetry/privacy en validatie.
- [x] Strict schema/gate voor question-, option- en info-button-defenses in nieuwe domeinen.

## UI/UX En Atomic Design Checklist

### Atoms

- [x] `Button`
- [x] `ActionRow`
- [x] `Card`
- [x] `Badge`
- [x] `Chip`
- [x] `Icon`
- [x] `Skeleton`
- [x] `ProgressBar`
- [x] Browser-native history is the only back-navigation control in clinical flows; dedicated `BackButton` and result `from` routes removed as duplicate navigation primitives.
- [x] `IconButton`
- [x] `Input`
- [x] `Select`
- [x] `Checkbox`
- [x] `Radio`
- [x] `Tooltip`

### Molecules

- [x] `SegmentedControl` voor role/theme/admin filters
- [x] `FormField`
- [x] `ChoiceOption`
- [x] `ChoiceGroup`
- [x] `InfoPopover`
- [x] `Notice`
- [x] `StatusBadge`
- [x] `SourceChip`
- [x] `CopyAction`

### Organisms

- [x] `AppHeader`
- [x] `LandingMenuGrid`
- [x] `QuestionPanel`
- [x] `MultiInputPanel` voor calculator-intakes zoals CVRM/PREVENT/SCORE2
- [x] `QuestionToolbar`
- [x] `ResultSectionList`
- [x] `DocumentationCopyPanel`
- [x] `ContraindicationGate`
- [x] `AdminLogList`
- [x] `AdminLogDetail`

### Templates

- [x] `PageShell`
- [x] `QuestionnaireTemplate`
- [x] `ResultTemplate`
- [x] `AdminTemplate`
- [x] `LandingTemplate`

### Design System Rules

- [x] Legacy `.md-button`, `.md-card`, `.md-tile` verwijderen of quarantainen.
- [x] Page-local badge/button/form styles vervangen door primitives.
- [x] Header controls naar shared `SegmentedControl`.
- [x] Alle touch targets minimaal 44px/48dp.
- [x] Geen `transition: all`.
- [x] Motion utilities in `motion.css`.
- [x] Reduced motion per utility, niet alleen global catch-all.
- [x] Storybook voor atoms, molecules, organisms, templates.
- [x] Storybook en componenttests voor lange klinische multi-input labels.
- [x] Route-level visual contractgate voor landing/questionnaire/result/admin.

## Telemetry Checklist

- [x] PHI/PII scrubber aanwezig.
- [x] Flow trail aanwezig.
- [x] Global window/rejection handlers aanwezig.
- [x] Dev persistence opt-in gemaakt.
- [x] Framework telemetry adapter interface.
- [x] App-specific source/config injecteerbaar.
- [x] No-op telemetry adapter voor packages.
- [x] Supabase adapter apart package/app-only houden.
- [x] Error classification delen tussen app en package.
- [x] Breadcrumb model typed maken.
- [x] Log persistence tests voor 401/403/429/5xx/offline.
- [x] Flush throw-path requeue test.
- [x] Breaker reload behavior test.
- [x] Explicit dev persistence enable test.
- [x] User-facing errorcopy per domein configureerbaar.
- [x] Sourcemap/upload docs voor consumers.

## Security En Privacy Checklist

- [x] Threat model voor framework package.
- [x] No PHI in telemetry contract.
- [x] No PHI in storage contract.
- [x] Storage TTL en keys configureerbaar.
- [x] CSP guidance voor consumer apps.
- [x] Sanitizer contract verplicht voor markdown/html.
- [x] Dependency audit in package CI.
- [x] Secret scanning in CI.
- [x] Package consumer fixture in CI.
- [x] RLS/admin dashboard blijft app-only.
- [x] Admin RLS gebruikt claim/email allowlist.
- [x] Log ingestion gebruikt RPC/Edge Function met schema/rate/source validatie.
- [x] `.map` files niet publiek deployen.
- [x] Security tests voor malicious flow metadata.

## Testing Checklist

- [x] AI authoring-guide regressietest bewaakt evidence-, role-, taal-, telemetry- en validatiecontracten.
- [x] Current full suite groen: 65 files, 294 tests.
- [x] Flow dead-end tests bestaan.
- [x] Progress tests bestaan.
- [x] Telemetry scrub/log-sink tests bestaan.
- [x] `build:flows` vóór tests in CI.
- [x] Flow tests gebruiken verse compiled output.
- [x] Package unit tests per package.
- [x] Result resolver package tests.
- [x] Route helper package tests.
- [x] Questionnaire runner package tests.
- [x] Consumer fixture app.
- [x] Urinestrip fixture e2e: nitriet positief redirect naar bacteriurie.
- [x] Urinestrip fixture e2e: nitriet negatief + leuko positief redirect naar leukocyturie.
- [x] Urinestrip fixture e2e: alles negatief toont no-conclusive-abnormality.
- [x] Role/context matrix tests.
- [x] Accessibility route tests.
- [x] Source/DOM visual contracttests voor critical UI.
- [x] Mutation testing pilot voor core traversal/outcome resolver.
- [x] Bundle budget per package.

## Performance Checklist

- [x] Core package zero DOM/framework dependencies.
- [x] Vue package tree-shakeable exports.
- [x] Admin/Supabase lazy app-only.
- [x] Markdown renderer lazy or injectable.
- [x] Manifest load cache strategy configurable.
- [x] Route prefetch opt-in.
- [x] Bundle budget package en app.
- [x] Lighthouse CI landing/questionnaire/result.
- [x] No layout shift from SVG/menu tiles.
- [x] Source maps buiten public deploy artifact houden.

## Urinestrip Test Case

Urinestrip wordt eerste end-to-end package fixture.

- [x] Compile `flows/strip.yaml` via strict compiler.
- [x] Load manifest through injected loader.
- [x] Render landing from manifest taxonomy.
- [x] Run questionnaire through framework runner.
- [x] `nitrite == positive` gives typed redirect outcome `{ type: "redirect", target: "bacteriurie" }`.
- [x] `nitrite == negative`, `leukocytes == positive` redirects to `leukocyturie`.
- [x] `nitrite == negative`, `leukocytes == negative`, `erythrocytes == positive` redirects to `hematurie`.
- [x] All negative gives typed result outcome.
- [x] Progress indicator correct through all branches.
- [x] Telemetry records flow start, step, redirect/result without PHI.
- [x] Accessibility: keyboard, screenreader label, focus order.

## Multi-Agent Rondes

### Ronde 1 — Foundations

- Agent A: compiler/schema/CI.
- Agent B: core runtime extraction.
- Agent C: design-system atomic split.
- Agent D: telemetry/testing/security.

Exit criteria:

- [x] `build:flows` strict.
- [x] `@beslismodel/core` scaffold.
- [x] Typed outcome model.
- [x] Urinestrip tests still green.

### Ronde 2 — Vue Runtime

- [x] Store factory.
- [x] Runner composable.
- [x] Questionnaire organism.
- [x] Result resolver composable.
- [x] Result renderer organism.
- [x] Landing generated from manifest.

### Ronde 3 — Design System

- [x] Atoms/molecules completed.
- [x] Legacy `.md-*` removed from app pages.
- [x] Storybook expanded.
- [x] Motion system centralized.

### Ronde 4 — Telemetry/Security

- [x] Adapter interface.
- [x] Supabase app adapter.
- [x] Error matrix tests.
- [x] Threat model doc.

### Ronde 5 — Package Build

- [x] Exports/files/declarations.
- [x] Library build via Rolldown/Vite.
- [x] Consumer fixture app.
- [x] CI matrix.
- [x] Versioning strategy.

### Ronde 6 — Extractie Naar Gitea En Lokale NPM

Doel: framework uit `urinest.rip` halen naar eigen package-map/repo, publishen naar lokale Gitea npm registry, en `urinest.rip` als consumer draaiend houden.
Voor nu is dit een geplande vervolgronde: pas uitvoeren nadat de huidige app- en package-gates groen zijn, en elke stap bewijzen met een registry consumer smoke voordat app-source uit deze repo verdwijnt.

- [x] Package-extractie, lokale Gitea npm publicatie en `urinest.rip` compatibiliteit zijn expliciet in dit plan opgenomen.
- [x] Nieuwe package-map/repo reproduceerbaar gemaakt met `extract-beslismodel-framework.mjs` en `check:framework-extract`, zodat framework-code als eigen `beslismodel-framework/` target zonder app-only code gebouwd kan worden.
- [x] Package-extractie-map gestart met dezelfde package boundaries als deze repo: core, compiler, cvrm-prevent, vue en testing; geen tijdelijke bundeling van app-only code.
- [ ] Packages verplaatsen: `@beslismodel/core`, `@beslismodel/vue`, `@beslismodel/compiler`, `@beslismodel/testing`.
- [x] Publieke exports in de package-map eerst exact gelijk houden aan de huidige exports in `packages/*/src/index.ts`.
- [x] App-only code expliciet niet meenemen: `flows/`, `src/views/admin`, Supabase client/log sink, Urinest icons/copy, PWA branding, `src/config/app-config.ts`.
- [ ] Gitea remote toevoegen zodra lokale URL/namespace vastligt.
- [x] Registry-config-gate toegevoegd: package `publishConfig.registry`, tokenvrije `.npmrc.example` en `check:package-release-config`.
- [x] Offline tarball-gate toegevoegd: `check:package-tarballs` bewijst dat publicatie-artefacten alleen `dist/` en `package.json` bevatten voordat registry publish gebeurt.
- [x] Packed-consumer-smoke toegevoegd: `check:package-consumer-smoke` pakt echte npm-tarballs uit in een schone tijdelijke consumer, importeert alleen publieke `@beslismodel/*` exports en doorloopt echte Urinestrip runner/redirect/result checks plus CVRM SCORE2 score/outcome-binding.
- [x] File-tarball install-smoke toegevoegd: `check:package-file-install-consumer-smoke` installeert de gepackte frameworkpackages via echte `file:` npm dependencies in een schone consumer, draait de geïnstalleerde `beslismodel` CLI en importeert alleen publieke `@beslismodel/*` exports.
- [ ] Lokale Gitea npm registry voorbereiden: package owner/scope, auth token, user-level `.npmrc` voor secrets, project `.npmrc` zonder token, scope registry config, en package `publishConfig.registry`.
- [ ] Prerelease-versies publiceren naar lokale Gitea npm met dist-tag `next` voordat `latest` wordt gebruikt.
- [x] Registry smoke consumer script toegevoegd: `check:package-registry-smoke` installeert packages via Gitea npm in een schone temp-map, compileert een minimale manifest-runner en draait Urinestrip redirect/result checks.
- [ ] Registry smoke uitvoeren tegen gepubliceerde Gitea prerelease packages met `BESLISMODEL_REGISTRY_SMOKE_VERSION`.
- [x] Package CI-template in nieuwe repo meenemen via `extract-beslismodel-framework.mjs`: lint, typecheck, tests, package smoke checks, package budget, npm audit en secret scan.
- [ ] `urinest.rip` package.json omzetten van monorepo source imports naar registry dependencies.
- [ ] `urinest.rip` Vite/TS aliases verwijderen of beperken tot lokale app-code nadat packages uit registry komen.
- [x] `urinest.rip` imports controleren: alleen publieke package-exports gebruiken; geen imports uit `packages/*/src`.
- [x] Tijdelijke dual-source afspraak vastleggen: tijdens extractie mag `urinest.rip` alleen switchen tussen workspace packages en registry packages via package manager config, niet via afwijkende importpaden of private package-source imports.
- [ ] `urinest.rip` build scripts aanpassen: package-build scripts verwijderen uit app-only CI, maar `check:packages` vervangen door registry smoke checks zolang extractie loopt.
- [ ] `urinest.rip` consumer fixture behouden als integratiecontract tegen gepubliceerde packages.
- [x] Migratievolgorde gedocumenteerd: publish prerelease packages naar lokale registry, install exacte prerelease-versies in `urinest.rip`, run `npm run check:packages`, `npm run test`, `npm run check`, `npm run budget`, `npm run build`, daarna pas oude package-source uit app repo verwijderen.
- [ ] Migratievolgorde uitvoeren met gepubliceerde prerelease packages en exacte registry-versies in `urinest.rip`.
- [ ] Na extractie `urinest.rip` draaiend houden via gepinde registry dependencies, lockfile-update, Vite dev smoke, productiebuild, PWA smoke, telemetry smoke, landing-grid regressie, questionnaire-switch regressie en Urinestrip end-to-end fixture.
- [x] App-compatibiliteitsadapter behouden voor `loadManifest`, role context, markdown sanitizer, telemetry adapter en taxonomy/icon mapping zodat de package geen Urinest-specifieke aannames terugkrijgt.
- [x] Package release-notes format gedocumenteerd met consumer-impact: gewijzigde exports, gewijzigde peer dependency ranges, migratiestappen en rollback-versie.
- [ ] Package release-notes in Gitea taggen zodra de prerelease packages bestaan.
- [x] Rollback-plan gedocumenteerd: registry dependency versions pinnen; vorige werkende packageversie in `package-lock.json` en Gitea tag houden.
- [ ] Rollback-plan uitvoeren en bewijzen met een echte registry-versie en Gitea tag.

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
- [x] AI-agents hebben een gedetailleerde authoring-guide voor nieuwe richtlijnwebsites en domeinpakketten.
- [x] Urinestrip fixture werkt als package consumer.
- [x] `npm run test`, `npm run check`, `npm run check:tsgo`, `npm run lint:all`, `npm run format:check`, `npm run build` groen.
- [x] CI bouwt flows vóór tests.
- [x] Geen unhandled benign browser transitions.
- [x] Geen dev Supabase 401 noise zonder opt-in.
- [x] Route-level axe smoke voor landing, questionnaire, result en error route.
- [x] Landing/questionnaire/result/admin a11y pass.
- [x] Package exports bruikbaar in extern project.
