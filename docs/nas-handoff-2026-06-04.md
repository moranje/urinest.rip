# NAS Handoff — Urinest.rip / Beslismodel Framework — 2026-06-04

Doel: deze overdracht naast `Preview framework...md` leggen en in de NAS-omgeving uitvoeren.
Aanname NAS: volledige lees/schrijftoegang tot `/code`, inclusief sibling repos zoals
`urinest.rip`, `beslismodel-framework`, `telemetry`, `tokens`, `xenia-ui`, `create-oranje-app`,
`abacus`, `patient-tracker`, `werkoverleg` en `labbie`.

Belangrijk: behandel de NAS-run als een volledige workspace-run, niet als de beperkte lokale
Codex-sandbox. Cross-repo git-index updates, package writes, registry checks en baseline-action
sync horen daar zonder per-commando akkoord uitgevoerd te kunnen worden. VS Code workspace-mappen
alleen zijn niet genoeg; de uitvoerende agent/runtime moet `/code` of de concrete sibling-repo's
ook echt als schrijfbare filesystem roots krijgen.

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
10. `AGENTS.md` in root, lokaal untracked maar inhoudelijk nuttig.

## Huidige Repostatus

### `urinest.rip`

Repo: `/Users/martien/Sync/Projects/code/urinest.rip`

Laatste commits:

```text
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

Belangrijk: package-source in `packages/*` is voorbereid op `0.1.0-next.1`, inclusief
`docs/package-release-notes-0.1.0-next.1.md`. De root app bevat nog exact pinned registry
dependencies naar de gepubliceerde `0.1.0-next.0`, totdat NAS `0.1.0-next.1` publiceert en
registry-smoke draait:

```json
"@beslismodel/core": "0.1.0-next.0",
"@beslismodel/vue": "0.1.0-next.0"
```

Dev dependencies:

```json
"@beslismodel/compiler": "0.1.0-next.0",
"@beslismodel/copd-care": "0.1.0-next.0",
"@beslismodel/cvrm-prevent": "0.1.0-next.0",
"@beslismodel/dm-care": "0.1.0-next.0",
"@beslismodel/testing": "0.1.0-next.0"
```

`.npmrc` has scope routing only:

```text
@oranje:registry=https://git.oranje.wtf/api/packages/martien/npm/
@beslismodel:registry=https://git.oranje.wtf/api/packages/martien/npm/
```

No project-level auth token should be committed.

### `beslismodel-framework`

Repo: `/Users/martien/Sync/Projects/code/beslismodel-framework`

Current status checked clean.

Latest commits:

```text
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
`f177fa4308a71c7a802212d986b7eeee370d9ecb`; newer pushed commit is `e296808`.

## Published Package Status

Registry:

```text
https://git.oranje.wtf/api/packages/martien/npm/
```

Published version:

```text
0.1.0-next.0
```

Prepared locally, not yet published:

```text
0.1.0-next.1
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

Registry smoke previously passed:

```bash
BESLISMODEL_REGISTRY_SMOKE_VERSION=0.1.0-next.0 npm run check:package-registry-smoke
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
- Local package source bumped to `0.1.0-next.1` for the next prerelease after Vue store
  persistence hardening.
- Root app migrated to exact registry dependencies.
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

After local continuation commits, only the user-provided workspace instruction remained untracked:

```text
?? AGENTS.md
```

Meaning:

- `AGENTS.md` is user-provided workspace instruction. Do not accidentally commit unless desired.
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
- theme toggle reads/writes one centralized model
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

Current `0.1.0-next.0` is published and consumed by `urinest.rip`.
Local package source is prepared for `0.1.0-next.1`, but this version still needs NAS publish,
registry smoke and root-app migration before it becomes a consumed registry dependency.

Before stable/latest:

```bash
cd /code/beslismodel-framework
npm ci
npm run check:packages
BESLISMODEL_REGISTRY_SMOKE_VERSION=0.1.0-next.0 npm run check:package-registry-smoke

cd /code/urinest.rip
npm ci
npm run check:packages
npm run check:app
npm run check:browser-smoke
npm audit --omit=dev --audit-level=high
```

Preferred stable path:

1. Confirm no new app UI/browser regressions with current smokes.
2. Publish prepared `0.1.0-next.1` to `next`, smoke, then migrate the root app.
3. If `0.1.0-next.1` is clean and no further API changes are needed, prepare stable `0.1.0`.
4. Do not put prerelease on `latest`; the publish guard rejects prerelease versions for that tag.
5. Stable/latest publish path is guarded by
   `BESLISMODEL_PUBLISH_TAG=latest BESLISMODEL_PUBLISH_CONFIRM=<exact-stable> npm run check:package-publish-next -- --publish`.
6. Create release notes:

   ```text
   docs/package-release-notes-0.1.0.md
   ```

7. Push tag:

   ```text
   beslismodel-v0.1.0
   ```

## High-Signal Command Checklist

### Urinest app full gate

```bash
cd /code/urinest.rip
node -v
npm ci
npm run check:app
npm run check:packages
npm run check:browser-smoke
npm audit --omit=dev --audit-level=high
```

### Framework full gate

```bash
cd /code/beslismodel-framework
node -v
npm ci
npm run check:packages
BESLISMODEL_REGISTRY_SMOKE_VERSION=0.1.0-next.0 npm run check:package-registry-smoke
npm run check:package-registry-smoke:current
npm audit --omit=dev --audit-level=high
```

### Registry auth

```bash
npm whoami --registry https://git.oranje.wtf/api/packages/martien/npm/
```

If Gitea returns 404 for npm whoami, scripts already have fallback through `/api/v1/user`.

### Package publish dry-run

```bash
npm run check:package-publish-next
```

### Package publish

```bash
BESLISMODEL_PUBLISH_CONFIRM=<exact-version> npm run check:package-publish-next -- --publish
```

### Registry smoke

```bash
BESLISMODEL_REGISTRY_SMOKE_VERSION=<exact-version> npm run check:package-registry-smoke
npm run check:package-registry-smoke:current
```

### App registry migration

Only needed for new package version:

```bash
BESLISMODEL_REGISTRY_MIGRATION_VERSION=<exact-version> npm run migrate:registry-deps -- --write
npm install
npm run check:app
npm run check:browser-smoke
```

## Multi-Round Plan For NAS

### Round 1 — State Capture

- [ ] `git status --short` in every repo.
- [ ] `git remote -v` in every repo.
- [x] `git log --oneline -10` in `urinest.rip` and `beslismodel-framework`.
- [ ] Find and read `Preview framework...md`.
- [ ] Compare that document with this handoff and `docs/framework-package-plan-2026-06-01.md`.
- [x] Confirm no tracked `.npmrc` auth tokens.
- [x] Confirm Node `>=20.19.0`.

Verified 2026-06-04:

- `urinest.rip` log captured through `6aea325 docs(audits): reconcile open checklist status`.
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
- `npm run test:app` passed: 81 files, 402 tests.
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
- [x] Verify light/dark/system theme toggle token parity in app tests.
- [x] Run app visual smoke in all three theme modes.

Verified 2026-06-04:

- `tokens` is `@oranje/tokens`: CSS source-of-truth, DTCG JSON exports and TS exports; repo is
  behind origin by 5.
- `xenia-ui` consumes `@oranje/tokens`, documents CSS-cascade theming and has token-discipline
  audit score 5/5 in its latest local audit; repo is behind origin by 4 and has untracked
  audit/package artefacts.
- `create-oranje-app` templates include `@oranje/tokens`, optional `@xenia/ui`, Gitea npm registry
  `.npmrc` placeholders and baseline pipeline docs; repo is behind origin by 2.
- `568905b test(theme): smoke app theme modes` added rendered browser checks for explicit light,
  explicit dark and system dark mode using generated theme colors.
- `npm run check:browser-smoke` passed after that change.

Commits:

```text
feat(tokens): add beslismodel design token export
feat(theme): centralize app theme metadata
test(theme): lock theme toggle token parity
```

### Round 4 — Framework Stable Release

- [x] Apply any package fixes needed after app UI regression work.
- [ ] Sync shared package scripts from root to `beslismodel-framework` if needed.
- [x] Run framework full gate.
- [x] Prepare `0.1.0-next.1` package source and release notes locally.
- [ ] Publish `0.1.0-next.1`.
- [ ] Run registry smoke.
- [ ] Migrate `urinest.rip` to exact `0.1.0-next.1` registry versions.
- [ ] Prepare and migrate to exact stable `0.1.0` registry versions after next smoke passes.
- [ ] Run app full gate.
- [ ] Push commits and tags.

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
- `d022544 chore(packages): bump next prerelease` bumped package source/internal pins to
  `0.1.0-next.1`, added `docs/package-release-notes-0.1.0-next.1.md`, and updated the extracted
  Gitea workflow default.
- Local verification after `0.1.0-next.1` prep:

  ```bash
  npm run check:package-release-notes
  npm run check:packages
  npm run test:consumer:urinestrip:only
  ```

  `npm run check:packages` passed including package extraction, package build, tarball validation,
  next publish dry-run, tarball/file-install consumer smokes, export checks, mutation pilot and
  Urinestrip type check. `npm run test:consumer:urinestrip:only` passed: 1 file, 7 tests.

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
- `npm run check:app` passed: flows, design tokens, format, oxlint/eslint, vue-tsc, tsgo, 81 app
  test files/402 tests, guideline traceability/copy, bundle budget and production build.
- `npm run check:packages` passed: standalone extraction, framework package gates, tarballs,
  publish dry-run, packed/file-install consumer smokes, package export checks, mutation pilot and
  Urinestrip consumer type/test gate.
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
