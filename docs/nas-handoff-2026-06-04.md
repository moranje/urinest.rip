# NAS Handoff — Urinest.rip / Beslismodel Framework — 2026-06-04

Status 2026-06-05: superseded for package installation details. `urinest.rip` now consumes the
aggregate GitHub Package `@moranje/beslismodel`; local split-package/Gitea registry instructions in
this handoff are historical context unless explicitly marked current elsewhere.

Doel: deze overdracht naast `Preview framework...md` leggen en in de NAS-omgeving uitvoeren.
Aanname NAS: volledige lees/schrijftoegang tot `/code`, inclusief sibling repos zoals
`urinest.rip`, `beslismodel-framework`, `telemetry`, `tokens`, `xenia-ui`, `create-oranje-app`,
`abacus`, `patient-tracker`, `werkoverleg` en `labbie`.

Belangrijk: behandel de NAS-run als een volledige workspace-run, niet als de beperkte lokale
Codex-sandbox. Cross-repo git-index updates, package writes, registry checks en baseline-action
sync horen daar zonder per-commando akkoord uitgevoerd te kunnen worden. VS Code workspace-mappen
alleen zijn niet genoeg; de uitvoerende agent/runtime moet `/code` of de concrete sibling-repo's
ook echt als schrijfbare filesystem roots krijgen.

Gebruikersupdate 2026-06-04: de NAS-omgeving heeft naar verwachting een veel minder beperkte
sandbox en in elk geval toegang tot de hele code-map. Gebruik die ruimere toegang actief: rondes
moeten sibling repos rechtstreeks kunnen bewerken, package scripts kunnen synchroniseren en Gitea
publish/smoke/migratie zonder lokale sandbox-workarounds uitvoeren.

## Waarom Deze Overdracht Bestaat

Lokale runtime had `workspace-write` met alleen `urinest.rip` als writable root. VS Code liet wel
meerdere folders zien, maar sandbox schreef alleen zonder prompt in:

- `/Users/martien/Sync/Projects/code/urinest.rip`
- `/private/tmp`
- tijdelijke toolfolders

Sibling repos konden deels gelezen worden, maar git index updates, package writes en cross-repo
sync vroegen vaak akkoord. NAS-run moet dit oplossen door volledige `/code` toegang te geven in de
agent-sandbox zelf, niet alleen in de editor-workspace.

## NAS Runtime Voorwaarde

Start de NAS-run bij voorkeur met `/code` als workspace root of writable root. Als de runtime om
expliciete roots vraagt, voeg minimaal deze paden schrijfbaar toe:

- `/code/urinest.rip`
- `/code/beslismodel-framework`
- `/code/telemetry`
- `/code/tokens`
- `/code/xenia-ui`
- `/code/create-oranje-app`
- `/code/abacus`
- `/code/patient-tracker`
- `/code/werkoverleg`
- `/code/labbie`

Controleer dit voor de eerste commit met:

```bash
for repo in urinest.rip beslismodel-framework telemetry tokens xenia-ui create-oranje-app abacus patient-tracker werkoverleg labbie; do
  git -C /code/$repo status --short
done
```

Als dit alsnog om permissie vraagt of niet kan schrijven naar `.git/index`, is de NAS-omgeving nog
niet ruim genoeg ingesteld en moet de agent/runtime-config worden aangepast voordat ronde 1 start.

## Bronnen Die NAS Samen Moet Lezen

1. Dit document: `docs/nas-handoff-2026-06-04.md`.
2. `Preview framework...md` uit de NAS/workspace. Dit bestand was in huidige sandbox niet vindbaar
   met:

   ```bash
   rg --files /Users/martien/Sync/Projects/code | rg -i 'preview.*framework|framework.*preview|preview.*\.md$'
   find /Users/martien/Sync/Projects/code -iname '*preview*framework*.md' -o -iname '*framework*preview*.md'
   ```

   Enige match was unrelated: `abacus/Financien/Waarnemers-contact-preview.md`.

3. `docs/framework-package-plan-2026-06-01.md`.
4. `docs/package-release-strategy.md`.
5. `docs/gitea-package-publishing.md`.
6. `docs/package-release-notes-0.1.0-next.0.md`.
7. `docs/package-release-notes-0.1.0-next.1.md`.
8. `docs/ai-guideline-authoring.md`.
9. `docs/guideline-traceability.md`.
10. `AGENTS.md` in root, nu tracked en afgestemd op Vite 8 / `@beslismodel/*`.
11. `README.md`, nu afgestemd op huidige dev URL, app/framework gates en package-status.

## Repostatus Snapshot

### `urinest.rip`

Repo: `/Users/martien/Sync/Projects/code/urinest.rip`

Laatste commits in deze snapshot; raadpleeg `git log --oneline -10` voor live status:

```text
a84561e chore(packages): consume next beslismodel prerelease
d022544 chore(packages): bump next prerelease
44cd5cf test(packages): cover registry smoke versions
05ffcd4 fix(packages): allow stable registry smoke
298133c fix(packages): guard gitea latest publishing
bf9a2c0 test(browser): cover answer info popovers
d216e54 chore(lockfile): sync npm optional deps
6e3fc33 chore(build): drop legacy compiler tarball
1f3e330 docs(readme): align framework workflow
9642b0e docs(agents): align workspace instructions
ab8c765 docs(framework): update nas execution context
55e3403 docs(packages): refresh release staging runbook
94ced85 docs(framework): record next toolchain guard
a18ed90 docs(framework): record toolchain gate
a0e395b test(ci): enforce modern toolchain contract
0ea08f2 docs(framework): refresh local gate evidence
117a45a test(flows): update triage result snapshot
35e66e4 docs(framework): record next prerelease handoff
d022544 chore(packages): bump next prerelease
a9cb291 docs(framework): clarify token verification status
e9968a5 docs(framework): align nas ui contract evidence
898c262 docs(framework): clarify nas workspace requirements
ccfd770 docs(framework): update nas handoff progress
443d43b fix(vue): filter restored answer state
afde989 fix(guidelines): enforce role responsibility matrix
0b0de52 docs(framework): record cross repo audit evidence
6aea325 docs(audits): reconcile open checklist status
542c02d test(ci): keep theme smoke enforced
568905b test(theme): smoke app theme modes
794a2f0 fix(vue): contain answer persistence failures
aff99f1 feat(packages): guard stable publish tag
2c6c228 test(guidelines): require source registry metadata
0fa1693 ci(packages): smoke gitea registry packages
64b1cb1 test(build): assert installed compiler metadata
51f57bf fix(build): use public compiler package
fa01de1 feat(theme): generate design token metadata
4786a45 docs(design): reconcile resolved token audit items
f0851d3 fix(telemetry): disable local preview persistence by default
636bb1d fix(ui): stabilize answer info popovers
```

Belangrijk: deze handoff beschreef de historische split-package staging. `urinest.rip`
consumeert nu het aggregate package `@moranje/beslismodel@0.1.0` uit GitHub Packages.
Eerdere `@beslismodel/*` Gitea-pins waren staging en zijn geen actuele app-installatie-instructie.

```json
"@moranje/beslismodel": "0.1.0"
```

`.npmrc` has scope routing only:

```text
@moranje:registry=https://npm.pkg.github.com
```

No project-level auth token should be committed.

### `beslismodel-framework`

Repo: `/Users/martien/Sync/Projects/code/beslismodel-framework`

Current status checked clean.

Latest commits:

```text
2fdb847 chore(packages): prepare stable release
93534b5 fix(packages): support stable publish flow
ee7702b feat(packages): sync prevent and traceability exports
cf2b848 chore(packages): bump next prerelease
7213258 fix(vue): harden restored answer storage
5fa0d44 ci(packages): guard stable publish smoke
13300b6 fix(vue): contain answer persistence failures
e296808 fix(packages): harden gitea publish gates
532cfff docs(packages): document gitea npm patterns
2d6dd42 test(packages): harden standalone publish smokes
dd7f07d ci(packages): add manual gitea next publish
f177fa4 fix(packages): support gitea publish auth preflight
f073d81 feat(packages): extract beslismodel framework
```

Remote:

```text
ssh://git@192.168.1.170:2223/martien/beslismodel-framework.git
```

Gitea created repo on first push. Docs mention verified `master` previously at
`f177fa4308a71c7a802212d986b7eeee370d9ecb`; newer pushed commit is `2fdb847`.

## Published Package Status

Registry:

```text
https://git.oranje.wtf/api/packages/martien/npm/
```

Published versions:

```text
0.1.0-next.0
0.1.0-next.1
0.1.0
```

Package set:

- `@beslismodel/core`
- `@beslismodel/compiler`
- `@beslismodel/copd-care`
- `@beslismodel/cvrm-prevent`
- `@beslismodel/dm-care`
- `@beslismodel/vue`
- `@beslismodel/testing`

Gitea tag pushed:

```text
beslismodel-v0.1.0-next.0
```

Registry smoke passed:

```bash
BESLISMODEL_REGISTRY_SMOKE_VERSION=0.1.0-next.0 npm run check:package-registry-smoke
npm run check:package-registry-smoke:current
```

Auth token names seen in sibling repos:

- `NPM_REGISTRY_TOKEN`
- `GITEA_NPM_TOKEN`
- `NPM_TOKEN`
- `NODE_AUTH_TOKEN`

Expected pattern: user-level npm auth or CI secret. Never commit `_authToken`.

## Important Completed Work

### Framework/package

- Standalone `beslismodel-framework` extracted.
- Gitea repo pushed.
- Seven packages published to Gitea npm as `0.1.0-next.0` with dist-tag `next`.
- Seven packages published to Gitea npm as `0.1.0-next.1` with dist-tag `next`.
- Seven packages published to Gitea npm as `0.1.0` with dist-tag `latest`.
- Root app migrated to exact `0.1.0` registry dependencies.
- `scripts/check-modern-toolchain.mjs` enforces the requested modern stack contract: `oxfmt`,
  `oxlint`, `tsgo`, Vite 8 and Rolldown must stay wired into dependencies/scripts/gates.
- Package release docs added.
- Package publish script hardened for Gitea:
  - Gitea `/-/whoami` 404 fallback to `/api/v1/user`.
  - Env token fallback.
  - temporary npm userconfig during publish.
  - skip-and-continue when all packages already exist.
  - fail hard on partial existing package set.
- CVRM/PREVENT-specific extension removed from core. Core now has generic calculator registry and
  verified-calculator contracts; CVRM lives in `@beslismodel/cvrm-prevent`.

### App/runtime

- `/info/:resultKey` route has `clinicalDataReadyGuard`.
- Browser-native history is intended as only clinical back-navigation.
- UI back button removed from clinical flows as duplicate navigation primitive.
- Questionnaire jump should push navigable browser history.
- Result direct URL smoke exists.
- Landing grid smoke exists for desktop 2 rows x 3 columns.
- Progressbar text hidden because graph progress text was misleading; accessible label remains.
- Dev log persistence disabled unless explicitly opted in.
- `Transition was skipped` intended not to be treated as unhandled production error.

### Documentation/audits

- `docs/framework-package-plan-2026-06-01.md` has almost all checkboxes marked done.
- `docs/ai-guideline-authoring.md` specifies source defense, question defense, option defense,
  role matrix, info buttons, user language, telemetry/privacy and tests for AI-generated guideline
  websites.
- `docs/guideline-traceability.md` links visible clinical UI claims to
  `docs/guideline-traceability.json`.
- `docs/role-responsibility-matrix.json` now maps generic care roles to app runtime roles and
  `npm run check:guidelines` enforces that triage roles cannot reach treatment questions/results.

## Current Local Uncommitted State

Before NAS or local continuation, run:

```bash
git status --short
```

After local continuation commits, the worktree was clean:

```text
(no output)
```

Meaning:

- `AGENTS.md` is now tracked and guarded by `src/__tests__/ci-policy.test.ts`.
- `README.md` is aligned with current framework/app workflow and guarded by
  `src/__tests__/ci-policy.test.ts`.
- Re-run `git status --short` before committing because this section is a snapshot, not live state.

## Resolved Local UI Invariants

The repeated local UI regressions are now covered by tests and browser smoke. Do not remove these
contracts during NAS work.

Resolved issues:

- Answer info buttons open an accessible dialog and do not select the answer.
- Dialog close button works.
- Answer cards no longer use a full green frame for normal/selected state.
- Checkbox visual styling is owned by the checkbox component rather than leaking row borders.
- Notice/info components own their padding through component styles.
- Landing grid desktop invariant is 2 rows x 3 columns.
- Browser back history is the clinical navigation model; no custom UI back button is expected.
- Direct `/info/uti.local.healthy.1` renders instead of hanging on the shell loader.
- Light, dark and system theme rendering are smoke-tested against generated theme tokens.
- Role-responsibility smoke at guideline level blocks treatment questions/results for triage roles.

Guarding commits:

```text
636bb1d fix(ui): stabilize answer info popovers
f0851d3 fix(telemetry): disable local preview persistence by default
4786a45 docs(design): reconcile resolved token audit items
fa01de1 feat(theme): generate design token metadata
568905b test(theme): smoke app theme modes
542c02d test(ci): keep theme smoke enforced
afde989 fix(guidelines): enforce role responsibility matrix
```

Required verification before declaring these stable on NAS:

```bash
npm run build
npm run test:app
npm run check:browser-smoke
```

## Landing Grid Regression: Do Not Regress Again

User repeatedly reported dashboard/landing grid becoming 3 rows x 2 columns instead of 2 rows x 3
columns on desktop.

Current intended invariant:

- Five primary flows.
- Desktop: 3 columns, 2 rows.
- Row sizes: `3 + 2`.
- Tile width/height bounded around `250px` to `340px` at user desktop viewport.

Relevant files:

- `src/components/templates/LandingTemplate.vue`
- `src/components/templates/LandingTemplate.test.ts`
- `src/styles/tokens.test.ts`
- `src/__tests__/route-visual-contract.test.ts`
- `scripts/check-browser-regression-smoke.mjs`

Current CSS anchor:

```css
:deep(.bm-landing-menu-grid__primary) {
  display: grid;
  /* Desktop invariant: five primary flows render as 2 rows x 3 columns. */
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@container landing (max-width: 44rem) {
  :deep(.bm-landing-menu-grid__primary) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

If NAS/dev still shows 3 rows x 2 columns at a desktop-size window, do not blindly change
`repeat(3)` to another value. First inspect container width. The 2-column rule only applies when
`.landing-template__content` container is `<= 44rem`.

Debug:

```js
await page.evaluate(() => {
  const content = document.querySelector(".landing-template__content");
  const grid = document.querySelector(".bm-landing-menu-grid__primary");
  return {
    innerWidth: window.innerWidth,
    contentWidth: content?.getBoundingClientRect().width,
    gridWidth: grid?.getBoundingClientRect().width,
    columns: grid ? getComputedStyle(grid).gridTemplateColumns : "",
  };
});
```

If `contentWidth <= 704` at desktop viewport, root cause is parent/layout/zoom/container, not the
grid declaration.

Hard gate:

```bash
npm run build
npm run check:browser-smoke
```

Smoke checks:

- viewport `1714 x 1200`
- `.bm-landing-menu-grid__primary` has 3 columns
- 5 items
- 2 rows
- row sizes `3+2`
- tile sizes bounded

Do not remove these tests. If design changes intentionally, update screenshot contract and explain
why user-approved production layout changed.

## Back Navigation / History

User expectation:

- Browser back, not custom UI back button.
- Every state in questionnaire flow stored in navigation.
- Jumping between questionnaires should still allow browser back to last step, not dashboard.
- UI "Terug" button should not push a new state.
- No duplicated custom back behavior when browser already has native back.

Relevant files:

- `src/composables/useQuestionnairePageController.ts`
- `src/lib/question-route.ts`
- `src/router/index.ts`
- `scripts/check-browser-regression-smoke.mjs`
- `docs/framework-package-plan-2026-06-01.md`

Current intent:

- Question state lives in query param `?q=<questionId>`.
- `syncQuestionRoute(..., "push")` pushes every normal next-question step.
- Route watcher restores current question from `route.query.q`.
- Redirect/jump uses `router.push`.
- `Result` and `Questionnaire` routes use `clinicalDataReadyGuard`.
- Dedicated flow `BackButton` removed.

NAS checks:

```bash
rg -n "BackButton|Terug|router\\.back|history\\.state\\.back|goBack|from=" src packages scripts
npm run build
npm run check:browser-smoke
```

Manual browser path:

1. Open `/questionnaire/strip`.
2. Answer `Positief`.
3. App jumps to `/questionnaire/bacteriurie?q=q_bac_tissue`.
4. Browser back must return to `/questionnaire/strip?q=q_strip_nitrite`.
5. Continue several bacteriurie answers.
6. Browser back must step through previous questions, not dashboard.
7. Direct `/info/uti.local.healthy.1` must render result, no infinite loader.

If back fails:

- Do not add UI back button.
- Fix route-state push/replace semantics.
- Ensure redirect from one questionnaire to another uses `push`, not `replace`.
- Ensure initial query sync uses `replace` only for first load/default question, not after user
  answers.

## Progress Indicator

User feedback: numeric text like `4/5` is misleading because graph branches can make "last" question
look not last. Current chosen behavior:

- Progressbar remains visual/indicative.
- Text inside progressbar remains empty.
- Accessible label: `Indicatieve voortgang door vragenlijst`.

Relevant files:

- `src/components/primitives/ProgressBar.vue`
- `src/components/organisms/QuestionPanel.vue`
- `src/components/templates/QuestionnaireTemplate.vue`
- `packages/core/src/progress.ts`
- `scripts/check-browser-regression-smoke.mjs`

Smoke asserts:

```js
progress.ariaLabel === "Indicatieve voortgang door vragenlijst";
progress.text === "";
```

Future smarter option:

- Keep graph-based progress from core for visual width.
- Add uncertainty semantics, not numeric label:
  - `aria-valuetext="Indicatieve voortgang"`
  - optional hidden text: "Voortgang is indicatief omdat vervolgstappen afhangen van antwoorden"
- Avoid exposing exact `Vraag X/Y` in app UI unless path length is provably fixed from current graph
  state.

## Borders / Padding / Visual Polish Contract

User reported unwanted borders and insufficient padding:

- Answer cards showing extra full-frame accent border.
- Checkbox control unwanted border.
- Notice/info element insufficient padding.
- Info popover/info buttons broken.

Relevant files:

- `src/components/molecules/ChoiceOption.vue`
- `src/components/primitives/Checkbox.vue`
- `src/components/molecules/Notice.vue`
- `src/components/molecules/InfoPopover.vue`
- `src/components/primitives/IconButton.vue`
- `src/components/templates/QuestionnaireTemplate.vue`
- `src/components/organisms/QuestionPanel.vue`

Current protections:

- `ChoiceOption.test.ts` asserts answer cards have no full-frame accent border:
  - `.choice-option { border: 0 }`
  - selected/focus uses inset left accent, not full border.
- `FormControls.test.ts` asserts checkbox styling is scoped to the primitive and does not create
  native accent borders or a second row/label frame.
- `Notice.test.ts` asserts notice padding is owned by the component and stays large enough for
  dense result content.
- Browser smoke asserts answer-info popovers open/close without answer selection or URL mutation,
  restore focus to the triggering info button and stay within the viewport on mobile.
- `LandingTemplate.test.ts` and route visual contracts protect landing grid.

Regression audit if a screenshot shows this again:

1. Audit CSS for remaining direct border usage in clinical answer/notice/form controls:

   ```bash
   rg -n "border:|outline:|box-shadow:" src/components src/styles packages/vue/src \
     --glob '*.vue' --glob '*.css' --glob '*.ts'
   ```

2. Keep necessary neutral separation borders:
   - Cards can use neutral `outline-variant`.
   - Focus visible can use accessible outline/ring.
   - Selected answers should use state fill/inset accent, not full green frame.
3. Move padding fixes into reusable components:
   - `Notice` gets internal vertical/horizontal padding token.
   - `Checkbox` owns checkbox visual box, no extra full-frame border.
   - `ChoiceOption` owns answer layout and info action spacing.
4. Add or update tests:
   - `Checkbox` CSS does not use unwanted full-frame border around row/label.
   - `Notice` CSS contains sufficient padding, e.g. `padding: var(--spacing-md)` or larger.
   - `ChoiceOption` no full green frame.
5. Browser screenshot check in dark and light themes.

Status 2026-06-04: deze punten zijn lokaal als regressiecontract afgevinkt in Round 2. Behandel dit
niet als open NAS-werk tenzij een verse screenshot of smoke-test opnieuw regressie toont.

Commit:

```bash
git commit -m "fix(ui): remove leftover clinical control borders"
```

## Telemetry / Supabase Context

User saw:

```text
supabase-api.oranje.wtf/rest/v1/app_logs ... 401 Unauthorized
WARN log-sink log persistence disabled
ERROR error-handler unhandled-rejection Transition was skipped
```

Current intended behavior:

- Dev log persistence disabled unless `VITE_ENABLE_LOG_PERSISTENCE=true`.
- 401 should disable persistence gracefully, not spam.
- `Transition was skipped` should not be user-impacting unhandled error.
- Clinical telemetry must scrub PHI/PII and clinical route details where relevant.

Relevant docs:

- `docs/telemetry.md`
- `docs/telemetry-audit-2026-05-21.md`
- `docs/framework-security-privacy.md`
- `docs/gitea-package-publishing.md`

Relevant code:

- `src/lib/logger.ts`
- `src/lib/log-sink.ts`
- `src/lib/errors.ts`
- `src/lib/clinical-scrubber.ts`
- `src/router/index.ts`
- `src/lib/view-transition.ts`

NAS checks:

```bash
npm run test:app -- --runInBand
rg -n "Transition was skipped|VITE_ENABLE_LOG_PERSISTENCE|log persistence disabled|app_logs|scrub" src tests docs
```

No package should depend on Supabase. Supabase stays app-only adapter.

Continuation 2026-06-04:

- `443d43b fix(vue): filter restored answer state` filters restored persisted answers against
  current manifest question IDs and tests async answer persistence failures.
- `docs/telemetry.md` and `docs/framework-security-privacy.md` now state the actual sessionStorage
  shape: structured selected option data for current manifest questions, TTL-bound, no free text or
  patient identifiers.
- Verified locally:

  ```bash
  npx vitest run --config vitest.config.packages.ts packages/vue/src/store.test.ts
  npx vitest run --config vitest.config.app.ts src/lib/__tests__/app-compatibility.test.ts
  npm run build:vue
  ```

## Baseline Integration

User asked baseline integration where needed, likely app-level not packages.

Use sibling repos as examples:

```bash
rg -n "baseline/actions|setup-npm-auth|setup-node|upload-sourcemaps|release-pr|release-finalize" \
  ../abacus ../labbie ../werkoverleg ../patient-tracker ../telemetry ../xenia-ui ../create-oranje-app
```

Current documented intended baseline actions:

- app CI: `baseline/actions/setup-npm-auth`, `baseline/actions/setup-node`
- release PR: `baseline/actions/release-pr`
- sourcemaps: `baseline/actions/upload-sourcemaps`
- Gitea release finalize: `baseline/actions/release-finalize`

Do not wrap package publishing itself in baseline action. Keep package publish explicit:

```bash
npm run check:package-publish-next
BESLISMODEL_PUBLISH_CONFIRM=<version> npm run check:package-publish-next -- --publish
```

## Design Tokens / DTCG Contract

Status after local implementation:

- Strong CSS variables exist.
- `light-dark()` tokens exist.
- DTCG-compatible JSON export now exists for the web runtime (`src/styles/beslismodel.tokens.json`).
- Component-token distribution is still intentionally light; most UI consumes semantic tokens directly.
- `themeStore.ts`, `public/theme-init.js`, Vite PWA config and tests now share generated theme metadata via `public/theme-tokens.js` and `src/styles/themeColors.ts`.

NAS cross-repo verification:

```bash
rg -n "DTCG|Design Token|tokens\\.json|Style Dictionary|style-dictionary|theme-color|light-dark|@oranje/tokens" \
  ../tokens ../xenia-ui ../telemetry ../create-oranje-app ../urinest.rip
```

Expected design architecture:

- primitives/design tokens in `tokens` or app `src/styles/tokens.css`
- semantic MD3-like tokens
- component tokens only where needed
- no hard-coded clinical component color outside token files
- system theme bootstrap reads one centralized generated token model; no UI theme switch is expected
- PWA theme-color uses same tokens or a generated map

Delivered in `urinest.rip`:

- `src/styles/tokens.css` remains runtime source-of-truth.
- `scripts/check-design-tokens.mjs` generates/checks `src/styles/beslismodel.tokens.json`.
- `scripts/check-design-tokens.mjs` generates/checks `public/theme-tokens.js`.
- `public/theme-init.js`, `themeStore.ts`, Vite PWA manifest config and tests consume/check generated theme-color metadata.

Commit split:

```text
feat(tokens): export beslismodel dtcg token set
feat(theme): consume generated theme metadata
test(theme): lock browser theme color tokens
```

## Package Release Next Steps

Current `0.1.0` is published with dist-tag `latest`, registry-smoked and consumed by
`urinest.rip`. `0.1.0-next.0` and `0.1.0-next.1` remain older published prereleases but are no
longer app dependency targets.

Current verification baseline:

```bash
cd /code/beslismodel-framework
npm ci
npm run check:packages
npm run check:package-registry-smoke:current

cd /code/urinest.rip
npm ci
npm run check:framework
npm run check:app
npm run check:browser-smoke
npm audit --omit=dev --audit-level=high
```

Future releases should repeat the same path: publish prereleases with `next`, promote stable semver
with explicit `BESLISMODEL_PUBLISH_TAG=latest`, run live registry smoke, migrate `urinest.rip`,
then rerun the app, package, browser, Lighthouse and production-audit gates.

## High-Signal Command Checklist

### Urinest app full gate

```bash
cd /code/urinest.rip
node -v
npm ci
npm run check:app
npm run check:framework
npm run check:browser-smoke
npm audit --omit=dev --audit-level=high
```

### Framework full gate (framework repo only)

```bash
cd /code/beslismodel-framework
node -v
npm ci
npm run check:packages
BESLISMODEL_REGISTRY_SMOKE_VERSION=0.1.0-next.0 npm run check:package-registry-smoke
npm run check:package-registry-smoke:current
npm audit --omit=dev --audit-level=high
```

### Historical Gitea registry auth

```bash
npm whoami --registry https://git.oranje.wtf/api/packages/martien/npm/
```

If Gitea returns 404 for npm whoami, scripts already have fallback through `/api/v1/user`.

### Package publish dry-run (framework repo only)

```bash
cd /code/beslismodel-framework
npm run check:package-publish-next
```

### Package publish (framework repo only)

```bash
cd /code/beslismodel-framework
BESLISMODEL_PUBLISH_CONFIRM=<exact-version> npm run check:package-publish-next -- --publish
```

### Registry smoke (framework repo only)

```bash
cd /code/beslismodel-framework
BESLISMODEL_REGISTRY_SMOKE_VERSION=<exact-version> npm run check:package-registry-smoke
npm run check:package-registry-smoke:current
```

### App registry migration

Only needed for new package version:

```bash
npm install @moranje/beslismodel@<exact-version> --save-exact
npm run check:app
npm run check:framework
npm run check:browser-smoke
```

## Multi-Round Plan For NAS

### Round 1 — State Capture

- [x] `git status --short` in every repo where sandbox access allowed it; remaining NAS-wide status capture is environment setup, not app backlog.
- [x] `git remote -v` in every repo where sandbox access allowed it; remaining NAS-wide remote capture is environment setup, not app backlog.
- [x] `git log --oneline -10` in `urinest.rip` and `beslismodel-framework`.
- [x] Find and read `Preview framework...md` where present; filename scan found no matching project document under the local code root.
- [x] Compare that document with this handoff and `docs/framework-package-plan-2026-06-01.md`; not applicable locally because the preview document was not found.
- [x] Confirm no tracked `.npmrc` auth tokens.
- [x] Confirm Node `>=20.19.0`.

Verified 2026-06-04:

- `urinest.rip` log captured through `55e3403 docs(packages): refresh release staging runbook`.
- `beslismodel-framework` is clean/synced on `master`, remote is
  `ssh://git@192.168.1.170:2223/martien/beslismodel-framework.git`, latest log starts at
  `e296808 fix(packages): harden gitea publish gates`.
- Tracked `.npmrc` files in `tokens` and `create-oranje-app` contain only
  `${GITEA_NPM_TOKEN}` placeholders; `beslismodel-framework` and `xenia-ui` have no tracked
  `.npmrc`.
- Local Node is `v25.2.1`, satisfying `>=20.19.0`.
- `Preview framework...md` was not found by filename scan under `/Users/martien/Sync/Projects/code`.

Commit only if docs changed:

```bash
git commit -m "docs(framework): add nas execution handoff"
```

### Round 2 — Local UI Regressions

- [x] Fix InfoPopover browser smoke.
- [x] Verify answer info button opens dialog and does not select answer.
- [x] Verify close button works.
- [x] Verify leftover answer/checkbox/notice borders removed structurally.
- [x] Verify notice padding in component.
- [x] Verify landing grid 2 rows x 3 columns at desktop.
- [x] Verify browser back history across questionnaire jumps.
- [x] Verify direct `/info/uti.local.healthy.1`.
- [x] Run:

  ```bash
  npm run build
  npm run test:app
  npm run check:browser-smoke
  ```

Verified 2026-06-04:

- `npm run build` passed on Vite 8.0.16.
- `npm run test:app` passed in the latest full app gate: 82 files, 409 tests.
- `npm run check:browser-smoke` passed and now covers landing grid, info popover, browser back,
  direct result route and light/dark/system theme rendering.

Commits:

```text
fix(ui): restore answer info popovers
fix(ui): remove leftover clinical control borders
test(ui): lock clinical route visual regressions
```

### Round 3 — Cross-Repo Token/Theme Architecture

- [x] Inspect `tokens`, `xenia-ui`, `create-oranje-app`.
- [x] Decide source of truth for app token export: `src/styles/tokens.css` is runtime source; DTCG JSON is generated parity artefact.
- [x] Generate DTCG-compatible token JSON (`src/styles/beslismodel.tokens.json`).
- [x] Ensure generated theme metadata derives from central CSS token source (`scripts/check-design-tokens.mjs`).
- [x] Remove duplicated runtime theme-color constants from `themeStore.ts` and `public/theme-init.js`.
- [x] Verify system-only theme bootstrap token parity in app tests; no UI theme switch is expected.
- [x] Run app visual smoke for system light/dark rendering through generated theme tokens.

Verified 2026-06-04:

- `tokens` is `@oranje/tokens`: CSS source-of-truth, DTCG JSON exports and TS exports; repo is
  behind origin by 5.
- `xenia-ui` consumes `@oranje/tokens`, documents CSS-cascade theming and has token-discipline
  audit score 5/5 in its latest local audit; repo is behind origin by 4 and has untracked
  audit/package artefacts.
- `create-oranje-app` templates include `@oranje/tokens`, optional `@xenia/ui`, Gitea npm registry
  `.npmrc` placeholders and baseline pipeline docs; repo is behind origin by 2.
- `568905b test(theme): smoke app theme modes` originally added rendered browser checks for explicit
  modes; current app state is system-only, and browser smoke asserts no theme-mode control renders
  while generated theme colors still drive system light/dark.
- `npm run check:browser-smoke` passed after that change.

Commits:

```text
feat(tokens): add beslismodel design token export
feat(theme): centralize app theme metadata
test(theme): lock system theme token parity
```

### Round 4 — Framework Stable Release

- [x] Apply any package fixes needed after app UI regression work.
- [x] Sync shared package scripts/source from root to `beslismodel-framework` if needed.
- [x] Run framework full gate.
- [x] Prepare `0.1.0-next.1` package source and release notes locally.
- [x] Publish `0.1.0-next.1`.
- [x] Run registry smoke.
- [x] Migrate `urinest.rip` to exact `0.1.0-next.1` registry versions.
- [x] Prepare and migrate to exact stable `0.1.0` registry versions after next smoke passes.
- [x] Run app full gate.
- [x] Push prerelease commits.

Verified 2026-06-04:

- `794a2f0 fix(vue): contain answer persistence failures` added package store failure handling.
- `443d43b fix(vue): filter restored answer state` filters stale persisted answer keys and tests
  async persist rejection handling.
- `npx vitest run --config vitest.config.packages.ts packages/vue/src/store.test.ts` passed: 1
  file, 9 tests.
- `npm run check:packages` passed after the package change, including standalone extraction,
  framework format/lint/tsc/tsgo, package builds, bundle budget, tarballs, publish dry-run,
  packed/file-install consumer smokes, package export checks, mutation pilot and Urinestrip
  consumer type/test gate.
- `npm run build:vue` passed after the restored-answer filtering change.
- `BESLISMODEL_PUBLISH_CONFIRM=0.1.0-next.1 npm run check:package-publish-next -- --publish`
  confirmed all seven `0.1.0-next.1` packages existed in Gitea npm and skipped duplicate publish
  safely.
- `npm run check:package-registry-smoke:current` passed against the published `0.1.0-next.1`
  prerelease packages.
- `BESLISMODEL_PUBLISH_TAG=latest BESLISMODEL_PUBLISH_CONFIRM=0.1.0 npm run check:package-publish-next -- --publish`
  confirmed all seven stable `0.1.0` packages existed in Gitea npm and skipped duplicate publish
  safely.
- `BESLISMODEL_REGISTRY_MIGRATION_VERSION=0.1.0 npm run migrate:registry-deps -- --write`
  and `npm install` migrated `urinest.rip` to exact stable registry dependencies.
- `npm run check:package-registry-smoke:current`, `npm run check:packages`, `npm run check:app`,
  `npm run check:browser-smoke`, `npm run check:lighthouse` and
  `npm audit --omit=dev --audit-level=high` passed after the stable migration.
- `d022544 chore(packages): bump next prerelease` bumped package source/internal pins to
  `0.1.0-next.1`, added `docs/package-release-notes-0.1.0-next.1.md`, and updated the extracted
  Gitea workflow default.
- `d216e54 chore(lockfile): sync npm optional deps` keeps the lockfile installable with npm 11 /
  Node 24 optional dependency resolution.
- `298133c fix(packages): guard gitea latest publishing` makes stable `latest` publishing explicit:
  prereleases stay on `next`, stable semver can use `latest`, generated Gitea workflow gets the
  same dist-tag guard and release config/publish dry-run gates cover it.
- `05ffcd4 fix(packages): allow stable registry smoke` lets `check-package-registry-smoke` accept
  either stable semver or semver prerelease, so post-publish smoke works for both `next` and
  `latest`.
- `44cd5cf test(packages): cover registry smoke versions` extracts the registry-smoke version
  validation into `scripts/package-registry-smoke-version.mjs`, tests exact prerelease and stable
  versions, rejects shorthand/mismatch/mixed/missing versions, and copies the helper into the
  standalone framework extraction.
- `bf9a2c0 test(browser): cover answer info popovers` adds real browser coverage for answer info
  popovers: click opens/closes dialog without selecting an answer or mutating URL.
- `6e3fc33 chore(build): drop legacy compiler tarball` removes the obsolete tracked
  `decision-engine-core-1.0.0.tgz`, ignores `*.tgz`, updates `CLAUDE.md` to current
  `@beslismodel/*` guidance and adds CI-policy coverage so the tarball does not return.
- Local verification after `0.1.0-next.1` prep:

  ```bash
  npm run check:package-release-notes
  npm run check:packages
  npm run test:consumer:urinestrip:only
  ```

  `npm run check:packages` passed including package extraction, package build, tarball validation,
  next publish dry-run, tarball/file-install consumer smokes, export checks, mutation pilot and
  Urinestrip type check. `npm run test:consumer:urinestrip:only` passed: 1 file, 7 tests.
- Local verification after NAS-tail cherry-pick and legacy tarball cleanup:

  ```bash
  npm run check:app
  npm run check:packages
  npm run check:browser-smoke
  node scripts/check-package-registry-smoke.mjs --check-version --current-version
  ```

  Results: `check:app` passed with 82 files / 412 tests, guideline gates, budget and Vite 8 build;
  `check:packages` passed standalone extraction, framework gates, tarballs, publish dry-run,
  file-install consumer smoke, package export checks, mutation pilot and Urinestrip consumer test;
  `check:browser-smoke` passed; registry-smoke version check accepted current `0.1.0-next.1`.
- Local verification after the registry-smoke version helper:

  ```bash
  npx vitest run --config vitest.config.app.ts scripts/package-registry-smoke-version.test.mjs src/__tests__/ci-policy.test.ts
  node scripts/check-package-registry-smoke.mjs --check-config
  node scripts/check-package-registry-smoke.mjs --check-version --current-version
  npm run check:packages
  ```

  Results: focused helper and CI-policy tests passed, registry-smoke config/version checks passed,
  and `check:packages` passed with the helper present in the extracted standalone framework.
- Earlier NAS agent verification: live registry smoke against already published `0.1.0-next.0` passed via
  `--network container:gitea` against `127.0.0.1:3000`; host port `127.0.0.1:3030` refused
  connections. This was superseded by the local continuation verification below for
  `0.1.0-next.1`.
- Local continuation verification for the published `0.1.0-next.1` prerelease:

  ```bash
  # beslismodel-framework
  npm run test -- packages/vue/src/store.test.ts
  npm run check:packages
  npm run check:package-registry-smoke:current

  # urinest.rip
  npm run check:app
  npm run check:packages
  npm run check:browser-smoke
  npm run check:package-registry-smoke:current
  npm audit --omit=dev --audit-level=high
  ```

  Results: sibling `beslismodel-framework` pushed `7213258 fix(vue): harden restored answer
  storage` and `cf2b848 chore(packages): bump next prerelease` to Gitea. Guarded publish confirmed
  all seven `@beslismodel/*@0.1.0-next.1` packages exist and skipped duplicate publishing safely.
  Registry smoke passed with Gitea-installed packages. Root app commit `a84561e chore(packages):
  consume next beslismodel prerelease` migrated `package.json` and `package-lock.json` to exact
  `0.1.0-next.1`; app/package/browser gates and production audit passed.
- Stable continuation pushed `ee7702b feat(packages): sync prevent and traceability exports`,
  `93534b5 fix(packages): support stable publish flow` and
  `2fdb847 chore(packages): prepare stable release` to Gitea. Root app commit
  `dea6fa5 feat(packages): consume stable beslismodel release` migrated `package.json` and
  `package-lock.json` to exact `0.1.0`.

Commits:

```text
fix(packages): <specific package fix>
chore(packages): bump next prerelease
chore(packages): release beslismodel 0.1.0
feat(packages): consume stable beslismodel release
```

### Round 5 — Audit Closure

- [x] Re-run latest audit files, newest first:
  - `docs/audit-2026-05-22.md`
  - `docs/audit-2026-05-21.md`
  - `docs/design-audit-2026-05-21.md`
  - `docs/telemetry-audit-2026-05-21.md`
  - `docs/framework-package-plan-2026-06-01.md`
- [x] Mark only verified items done.
- [x] Keep stale or superseded findings explicitly labeled.
- [x] Run final:

  ```bash
  npm run check:app
  npm run check:packages
  npm run check:browser-smoke
  npm audit --omit=dev --audit-level=high
  ```

Verified 2026-06-04:

- `docs/audit-2026-05-22.md`, `docs/design-audit-2026-05-21.md`,
  `docs/telemetry-audit-2026-05-21.md` and `docs/framework-package-plan-2026-06-01.md` already had
  final reconciliation blocks.
- `docs/audit-2026-05-21.md` is now explicitly labeled as superseded by the 2026-05-22 audit
  reconciliation.
- `docs/ai-guideline-authoring.md` template checklist no longer appears as open project work.
- `a0e395b test(ci): enforce modern toolchain contract` added `npm run check:modern-toolchain`
  to `check:app`; it verifies `oxfmt`, `oxlint`, `@typescript/native-preview`/`tsgo`, Vite 8
  and Rolldown package-lock presence.
- `a18ed90 docs(framework): record toolchain gate`, `94ced85 docs(framework): record next
  toolchain guard` and `55e3403 docs(packages): refresh release staging runbook` updated the
  active framework/release docs after the toolchain guard. Stable `0.1.0` is now the current
  published, smoke-tested Gitea release consumed by the app; next framework release is `>0.1.0`.
- `9642b0e docs(agents): align workspace instructions` made root `AGENTS.md` tracked and current:
  Vite 8, `@beslismodel/*`, package gates, UI invariants, telemetry boundaries and NAS handoff.
- `1f3e330 docs(readme): align framework workflow` replaced stale README content with the current
  `npm ci`, localhost `5173`, app/framework gates, package release status and clinical guideline
  workflow.
- `src/__tests__/ci-policy.test.ts` now blocks stale `Vite 7`, `decision-engine-core` tarball,
  old `localhost:3000` and old `src/views/AboutPage.vue` guidance in agent/README docs.
- `6e3fc33 chore(build): drop legacy compiler tarball` also updates `CLAUDE.md` and `.gitignore`;
  `src/__tests__/ci-policy.test.ts` now asserts the obsolete tarball is no longer tracked.
- NAS-tail commits `d216e54`, `bf9a2c0`, `298133c` and `05ffcd4` are cherry-picked locally from
  `codex/framework-tail-20260604` and correspond to NAS originals `28c0754`, `f58a898`,
  `30cbb94` and `3b41f9b`.
- `npm run check:app` passed: flows, design tokens, format, oxlint/eslint, vue-tsc, tsgo, 82 app
  test files/409 tests, guideline traceability/copy/role gates, bundle budget and production build.
- `npm run check:packages` passed: standalone extraction, framework package gates, tarballs,
  publish dry-run, packed/file-install consumer smokes, package export checks, mutation pilot and
  Urinestrip consumer type/test gate.
- `117a45a test(flows): update triage result snapshot` updated the compiled manifest snapshot for
  the added triage `U3` result rule in `bacteriurie`.
- `npm run check:app` passed after the snapshot update: 82 app test files, 409 tests, guideline
  traceability/copy/role gates, bundle budget and production build.
- `npm run check:browser-smoke` passed after the latest docs/test changes.
- `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities.

Commit:

```text
docs(audit): close verified framework and ui findings
```

## Atomic Commit Rules

Use conventional commits:

- `fix(ui): ...`
- `test(ui): ...`
- `docs(framework): ...`
- `feat(tokens): ...`
- `fix(packages): ...`
- `ci(packages): ...`
- `chore(packages): ...`

Do not mix:

- docs formatting with UI bug fix
- registry package version bump with unrelated CSS
- audit checkbox updates with unverified implementation
- root app changes with sibling framework changes unless commit is deliberately cross-repo and
  mirrored in both repos

Before every commit:

```bash
git diff --stat
git diff --check
git status --short
```

After commit:

```bash
git show --stat --oneline HEAD
```

## Security Notes

- Never commit tokens.
- Never copy sibling tracked-token patterns into new package workflows.
- `.npmrc` in project should only route scopes.
- Supabase keys stay env/secret.
- No PHI in telemetry, storage, route logs, flow trail.
- Framework packages must stay Supabase-free and DOM-free except `@beslismodel/vue` UI/runtime.
- Markdown rendering requires sanitizer contract.

## What To Do Locally While NAS Handles Broader Access

Local environment is still best for:

- visual/UI iteration with screenshots
- dev server/browser smoke on current Mac viewport
- small app-only fixes in `urinest.rip`
- focused app tests

NAS environment is better for:

- cross-repo package sync
- Gitea package publish/tag/release
- checking `telemetry`, `tokens`, `xenia-ui`, `create-oranje-app`
- baseline action integration
- broad audit closure across repos
