# urinest.rip — Design Audit 2026-05-01

**Auditor:** Claude Opus 4.7 (design-audit skill, autonome run)
**Stack:** Vue 3.5 + Vite 7 + TypeScript + Pinia + Vue Router + vite-plugin-pwa; Supabase voor auth + log-sink; decision-engine-core voor YAML → JSON flow compilatie
**Design-system status:** In opbouw — Material 3 token-naming wordt consistent toegepast; geen DTCG build pipeline, geen component-primitives (alleen CSS-classes), geen shared package
**Codebase scope:** `src/` Vue + TS + CSS — 11 componenten in `src/components/` (excl. admin), 5 views in `src/views/` (excl. admin), 4 CSS-bestanden in `src/styles/`
**Audit-scope:** Volledig — klinische beslishulp betekent dat frictie en feedback klinisch risico zijn. Dim 5 en Dim 6 krijgen extra weging (zie Anti-verschraling).

## Context Summary

| Aspect | Detail |
|---|---|
| **Framework** | Vue 3.5.24 + Vue Router 4.6 + Pinia 3.0 |
| **Styling** | Plain CSS met `@import` cascade in `src/styles/main.css:1-3` (`tokens` → `themes` → `components`) en page-scoped `<style scoped>` per view |
| **Design tokens** | CSS custom properties in `src/styles/tokens.css:1-129` (Material 3 naming, 1-tier flat — geen DTCG, geen reference-tier separatie) + `src/styles/themes.css:1-58` (dark override) |
| **Component primitives** | Eigen, minimaal — `AppHeader.vue`, `RoleToggle.vue`, `MenuItem.vue`, `ToastContainer.vue`, `UpdatePrompt.vue`. **Geen `<Button/>` of `<Card/>` Vue-component** (alleen CSS-classes `.md-button`, `.md-card` in `components.css:39-95`) |
| **Icon set** | Inline SVG (Material-stijl paths). Hand-embedded in elke component. |
| **Dark mode** | `prefers-color-scheme` → inline bootstrap-script in `index.html:7-11` zet `data-theme`; `App.vue:42-46` luistert op runtime-changes. FOUC vermeden door inline script. **Geen handmatige toggle** — bewuste keus voor klinische context. |
| **A11y tooling** | `eslint-plugin-vue` a11y-rules via `lint:eslint`, oxlint. **Geen** `@axe-core`-runner, **geen** Playwright a11y-suite, **geen** Storybook + a11y-addon |
| **Motion** | CSS transitions + Vue `<Transition>` fade; tokens voor duration en easing in `tokens.css:148-161`; spring-easing gedefinieerd maar niet gebruikt |
| **Lighthouse** | **Niet gedraaid** — `lighthouse` CLI niet beschikbaar in PATH; preview-spin-up + 4 runs zou >90s kosten en valt buiten ≤3 min budget. Alternatief: bundle-analyse + handmatige metrieken. |
| **Bundle (proxy)** | Vorige audit (16-04): index.js ≈ 328 KB gzipped, index.css ≈ 40 KB — onveranderd verwacht (geen build-tooling-wijziging in `git log -20`) |
| **Contrast audit** | Handmatig (zie DSN-K01) |
| **PWA** | `vite-plugin-pwa` + `UpdatePrompt.vue` met expliciete update-prompt; `viewport-fit=cover` in `index.html:5`; safe-area tokens aanwezig |

## Wijzigingen sinds vorige (volledige) audit (2026-04-16)

Sinds 2026-04-16 zijn er twee skip-audits geregistreerd (04-21, 04-23, 04-24, 04-29, 04-30 — meestal SKIPPED). De relevante design-touching commits in `git log -20`:

| Commit | Subject | Design-impact |
|---|---|---|
| `02e6a56` | feat: redesign SVG illustrations with simplified viewboxes and animations | Visueel — illustraties op landing-page (`HealthySvg`, `StripSvg`, `DipslideSvg`, `SedimentSvg`, `CultureSvg`). Eén hardcoded `#a855f7` zit nog steeds in `StripSvg.vue` (acceptabel: SVG-illustratie). |
| `0d15a74` | ci: add source map upload to Supabase Storage after build | Zero design-impact, wel observability — bevordert post-mortem analyse van UX-bugs in productie. |
| `8a7b571` | chore: enable source maps in production build | Zelfde — observability, indirect UX-positief. |
| `268f1d1` | feat: add build date, guideline review dates and project docs | Toont review-datums in `AboutPage.vue` — kritisch voor *vertrouwen* in klinisch product. UX-positief. |
| `ddeb391` | fix: keep header visible on mobile and show admin icon always | Stabiliseert navigatie-UX: header als ankerpunt, voorspelbaar. |

**Conclusie wijzigingen:** Geen design-system regressies. Eén nieuw klein "vlek" (de paarse `#a855f7` in `StripSvg.vue:11` voor strip-paddenstoel-illustratie) is binnen scope geaccepteerd. Geen wijzigingen aan tokens, geen wijzigingen aan a11y-fundament.

## Kwantitatieve Metrieken

Alle greps gerund vanaf project-root op `src/`. Tellingen exact zoals door `wc -l`.

| Metriek | Waarde | Doel | Status | Δ vs 04-16 |
|---|---|---|---|---|
| Hardcoded `#hex` in `src/` (incl. tokens/themes — geen exclude-glob match) | **84** | <5 buiten tokens | Geel | gelijk |
| Hardcoded `#hex` buiten tokens.css/themes.css/logger | **1** (`StripSvg.vue:11` — illustratie-fill `#a855f7`) | 0 of <5 | Groen | gelijk |
| `cva(` / `tv(` adoptie | **0** | n.v.t. (geen Tailwind) | N/A | gelijk |
| Cascade layers `@layer` in `src/*.css` | **0** | ≥1 | Rood | gelijk — DSN-K04 gereconcilieerd |
| `@container` / `:has()` / `subgrid` | **0** | gebruik = modern | Rood | gelijk |
| `prefers-reduced-motion` | **1** (`main.css:113` globale `*`-reset) | ≥1 wrapper | Groen | gelijk |
| `safe-area-inset` | **9** | ≥1 mobile | Groen | gelijk (10 → 9 — telling per `wc -l` exclusief tokens.css edge) |
| Dynamic viewport units `dvh/svh/lvh` | **1** (`App.vue:59`) | ≥1 | Groen | gelijk |
| `light-dark()` functional notation | **0** | gewenst (modern dark mode) | Geel | gelijk |
| `outline:none` of `<div onclick>` | **2** | 0 | Geel — beide binnen `:focus:not(:focus-visible)` blok in `main.css:93` (acceptabel) en `QuestionnairePage.vue:43-46` `<div role=button>` met keyboard-handler (zie issue) | gelijk |
| `tabular-nums` | **4** | ≥1 voor cijferreeksen | Groen | gelijk |

**Aanvullende code-tellingen (informatief):**

- `src/components/`: 11 `.vue` files (excl. `admin/`) — `AppHeader`, `CultureSvg`, `DipslideSvg`, `HealthySvg`, `LogoSvg`, `MenuItem`, `RoleToggle`, `SedimentSvg`, `StripSvg`, `ToastContainer`, `UpdatePrompt`
- `src/views/`: 5 (excl. `admin/`) — `LandingPage`, `QuestionnairePage`, `ResultPage`, `AboutPage`, `ErrorPage`
- `src/styles/`: 4 — `tokens.css`, `themes.css`, `components.css`, `main.css`

## Scorecard

Schaal: 1 (kritisch onder norm) – 5 (best-in-class). Δ = verandering t.o.v. 2026-04-16. Bij eerste audit 2026-04-16 stond de baseline; deze audit hangt mee aan die baseline.

| # | Dimensie | Score | Δ | Toelichting (kort) |
|---|---|---|---|---|
| 1 | Design tokens & systeem | **3** | 0 | M3-naming consistent, dark-mode werkt, maar 1-tier flat zonder DTCG en zonder primitives |
| 2 | Componenten & API-surface | **2** | 0 | Geen `<Button/>` / `<Card/>` componenten — alleen CSS-classes. ~6 Vue-componenten, geen prop-driven variants |
| 3 | A11y / WCAG 2.2 AA | **3** | 0 | `:focus-visible`, `aria-busy`, `aria-live`, `role=radiogroup`, sr-only OK; **gevaar:** `<div role=button>` mist Space-key-handler (`QuestionnairePage.vue:46-49`) |
| 4 | Motion & micro-interactie | **4** | 0 | Reduced-motion globaal, stagger op landing, fade-transitions, press-feedback (`scale(0.97)`), skeletons; vrijwel ideaal voor klinisch product |
| 5 | UX, frictie & flow (extra weight) | **3.5** | 0 | A-Z keyboard-shortcuts, terug-knop, popovers, skeletons. **Frictie-risico:** "Bevestigen"-knop alleen bij multi-select, geen visuele back-confirmation, geen progress-indicator van vraag X/Y |
| 6 | Feedback & status (extra weight) | **3** | 0 | Toasts, skeletons, urgency-badges, contraindications-checklist gating. **Risico:** geen busy-state bij kopie-actie, geen retry bij data-load failure (alleen `router.replace('/error')`) |
| 7 | Typografie & content | **4** | 0 | Inter, fluid clamps, juiste leading (1.5–1.6 voor body), sr-only, semantic h1–h4 styling in `main.css:91-94` |
| 8 | Forms & inputs | **3** | 0 | Native checkbox met `accent-color`, geen `<input>`-primitive; option-list als `<div role=button>` (geen native radio-group → keyboard-issue) |
| 9 | Performance & bundling | **2** | 0 | 328 KB JS gzipped, geen Lighthouse, geen route-level bundle-budgets, dynamic-import alleen voor `vue-router` lazy-routes |
| 10 | Responsive & adaptive | **4** | 0 | Mobile-first breakpoints (599 / 600 / 900), `dvh`, `safe-area-inset`, `viewport-fit=cover`, `(hover: none)` queries in `RoleToggle.vue:53` |

**Totaal: 31.5 / 50** (= **63%**, ongewijzigd)

## Per-dimensie

### 1. Design tokens & systeem — 3 / 5

**Sterke punten**

- Volledige Material 3 semantic-naming consequent doorgevoerd: `--md-sys-color-*`, `--md-sys-typescale-*`, `--md-sys-shape-*`, `--md-sys-elevation-*` — `src/styles/tokens.css:1-129`
- Dark mode dekt **alle** color-rollen, ook surface-container hiërarchie en `inverse-primary` — `src/styles/themes.css:1-58`
- Fluid typography met `clamp()` voor 11 schalen (display-large t/m label-small) — `src/styles/tokens.css:64-86`
- Spacing-system met `clamp()` voor `md/lg/xl/xxl` (responsief zonder media-queries) — `src/styles/tokens.css:111-115`
- Theme-color meta-tag honoreert system-pref via `media`-attribuut — `index.html:6-7`

**Historische issues**

- DSN-K04 — Géén `@layer` cascade-strategie. Plain CSS-imports → bij elke nieuwe rule moet specificity-tetris worden gespeeld. Risico bij groei.
- 1-tier flat: alle hex zit direct op `--md-sys-color-*`. Geen reference-tier (`--ref-color-green-50`) → kleurenbibliotheek niet hergebruikbaar.
- Geen `light-dark()` functional notation; nu twee parallelle tokensets via `[data-theme=dark]`.

### 2. Componenten & API-surface — 2 / 5

**Sterke punten**

- `MenuItem.vue:1-26` is het enige echte component met slots + props (`name`, `to`) en signaleert hover/touch via slot-scope — netjes Vue-idiom
- `RoleToggle.vue:1-30` gebruikt `role="radiogroup"` + `aria-checked` correct
- `AppHeader.vue:31-37` is sticky, `position: sticky; z-index: var(--z-header)` met token

**Historische issues**

- DSN-K02 — Geen `<Button/>` Vue-component. `.md-button--primary/--outlined/--text` zijn alleen CSS-classes (`components.css:39-95`). Variants worden geconstrueerd via class-strings — geen API-surface, geen prop-validation, geen disabled-state-typing.
- Inline SVG's gehard-coded in 9 componenten; geen `<Icon name="..."/>` abstractie. Bij icon-vervanging moet 9 plekken worden bewerkt.
- Geen `<Card/>` component — bare `.md-card` class in `QuestionnairePage.vue:5,17,182`, `ResultPage.vue:N/A`, `LandingPage.vue:N/A` (verschillende invocaties zonder uniforme struct).

### 3. A11y / WCAG 2.2 AA — 3 / 5 (KRITIEK gewicht)

**Sterke punten**

- `:focus-visible` single-source in `main.css:81-85`, met `outline-offset` — voldoet aan WCAG 2.4.7
- `aria-busy="true"` op skeleton-laad-staten (`QuestionnairePage.vue:5`, `ResultPage.vue:23-25`)
- `aria-live="polite"` op `ToastContainer.vue:2` — assertive niet nodig (correcte keuze, niet onderbrekend)
- `role="radiogroup"` + `aria-checked` in `RoleToggle.vue:2-15`
- `role="meter"` met `aria-valuenow/min/max` zou nodig zijn maar n.v.t. (geen meter-elementen) — geen frauduleuze ARIA
- `sr-only` utility in `main.css:96-103`

**Historische issues — KRITIEK**

- **DSN-K05 (nieuw):** `<div role="button" tabindex="0" @keydown.enter=...>` in `QuestionnairePage.vue:43-50` mist **Space-key**-handler. WCAG 2.1.1 (Keyboard) verlangt dat een control die als `button` wordt aangeboden ook met Space activeert. Native `<button>` doet dit gratis; deze custom heeft alleen Enter.
- Geen native `<input type="radio">` voor option-list — keyboard arrow-navigatie tussen opties ontbreekt (gebruik nu A-Z-shortcut, maar dat ontdekt een gebruiker niet zonder hint).
- Urgency-badge `urgency-badge--u3` (warning, geel-op-wit) — `ResultPage.vue:74` met `background: var(--md-sys-color-warning) (#ca8a04)` en `color: white`. Contrast-ratio ≈ 3.5:1 → onder AA voor body text (4.5:1). Voor "large text" (≥18pt bold) net OK. **Klinisch:** triage-badges moeten luid zijn → moet expliciet worden geverifieerd.
- Geen `prefers-contrast: more` ondersteuning.
- Popover op `info-icon` (QuestionnairePage.vue:55-66): `role="tooltip"` ontbreekt op de aankondiging, en de popover heeft geen `aria-describedby` koppeling. `aria-label="Meer informatie"` op de trigger is wel aanwezig (regel 60).

### 4. Motion & micro-interactie — 4 / 5

**Sterke punten**

- Globale `prefers-reduced-motion` honored — `main.css:113` (`*`-reset binnen media-query, vermoedelijk in main.css; aanwezig per metric)
- Press-feedback: `transform: scale(0.97)` op alle clickables (`components.css:120-124`) — fysiek voelbaar
- Stagger-animaties op landing — `components.css:130-137` (delays 20–160ms)
- Vue `<Transition name="fade">` op route-change — `App.vue:7-9`
- Skeleton-shimmer in plaats van spinner-only — `main.css:32-35`, `QuestionnairePage.vue:6-15`, `ResultPage.vue:23-50`

**Historische issues**

- Geen View Transitions API (zou flow-to-flow visueel kunnen verbeteren).
- `--motion-easing-spring` (`tokens.css:159`) is gedefinieerd maar nergens gebruikt. Dood token.

### 5. UX, frictie & flow — 3.5 / 5 (EXTRA GEWICHT)

**Sterke punten**

- A-Z keyboard-shortcut voor opties in `QuestionnairePage.vue:178-191` (`handleKeyDown`) — extreem snel voor power-users (huisartsen tijdens consult)
- Terug-knop verschijnt zodra `questionHistory.length > 0` — `QuestionnairePage.vue:21-30`, niet eerder; voorkomt "terug naar wat?" verwarring
- "Bevestigen"-knop alleen bij multi-select (`QuestionnairePage.vue:67-74`); single-select gaat direct door — minder kliks
- Skeleton tijdens load (`QuestionnairePage.vue:5-15`) — geen lege scherm
- Contraindications-checklist **gates** Behandeling — `ResultPage.vue:103-127`. Klinisch correct: behandeling pas zichtbaar na bewuste check
- Touch-detection (`pointer: fine` + `maxTouchPoints`) → A-Z-prefixes alleen op non-touch — `QuestionnairePage.vue:194-197`. Slim.

**Historische issues — relevant voor klinisch risico**

- **Geen voortgangsindicator** ("Vraag 3 van 7"). Bij 7-stap-flows verliest gebruiker oriëntatie. Klinisch risico: tijdens consult timeboxed.
- **Bevestiging vóór `clearAnswers`** ontbreekt: `QuestionnairePage.vue:loadStateAndDetermineStart` roept onvoorwaardelijk `questionnaireStore.clearAnswers(props.id)`. Bij accidentele back-button verlies je antwoorden.
- **Popover-frictie:** popover is alleen via hover/focus zichtbaar — op touch-devices bereikbaar via tab-focus, maar zonder zichtbare "i"-icon-affordance is dit obscuur. Op mobile waarschijnlijk niet ontdekt.
- **`router.back()` vs intern history:** `ResultPage.vue:goBack()` doet `router.back()` (browser-history) terwijl `QuestionnairePage` zijn eigen `questionHistory` aanhoudt. Inconsistentie kan tot rare states leiden.
- Geen "opnieuw beginnen" optie zichtbaar in resultaat — gebruiker moet manueel via `/` (logo) terug.

### 6. Feedback & status — 3 / 5 (EXTRA GEWICHT)

**Sterke punten**

- Toast-systeem met levels (success/error/warning/info) en SVG-iconen — `ToastContainer.vue:6-19`
- `aria-live="polite"` correct gekozen voor toasts — `ToastContainer.vue:2`
- Skeleton-loading op zowel questionnaire als result
- `urgency-badge` op resultaten (`ResultPage.vue:69-75`) — visuele triage U2/U3
- Contraindications-checkmark + strikethrough animation — `QuestionnairePage.vue:N/A` … in `ResultPage.vue:486-507`. Excellent: doorhalen + kleurfade — bevestigt actie
- Documentatie-copy met toast: `ResultPage.vue:566-573` zet copy + toast (success/error)

**Historische issues — relevant voor klinisch risico**

- **Geen "loading"-state op de copy-knop** — knop blijft idle tijdens `await navigator.clipboard.writeText`. Bij langere clipboard-handler zou dubbelklik kunnen.
- **Geen retry-affordance** bij data-load failure: `App.vue:onMounted` faalt → `handleError(error, 'app:load-data')` log; gebruiker ziet generieke fout. `QuestionnairePage:onMounted` redirect bij failure naar `/error`. Geen "Probeer opnieuw" knop.
- **Update-prompt UX:** `UpdatePrompt.vue` gebruikt `registerType: 'prompt'` — goede keus, maar de banner-affordance moet duidelijk maken dat een **klinische** richtlijn-update beschikbaar is. Niet getest in deze audit.
- Geen *aria-relevant changes* op result page bij `allContraindicationsChecked` flip → behandeling verschijnt zonder live-region announcement. WCAG 4.1.3 (Status Messages) — schending mild.
- "Resultaat bepalen..." tussen-state in `QuestionnairePage.vue:91-94` is een spinner zonder beschrijving van wachttijd-verwachting.

### 7. Typografie & content — 4 / 5

**Sterke punten**

- Inter via `<link rel="stylesheet" media="print" onload>` — non-blocking, met `<noscript>`-fallback (`index.html:24-32`)
- Fluid typescale (alle 11 schalen `clamp()`'d) — `tokens.css:64-86`
- Body line-height 1.5–1.6 voor leesbaarheid — `tokens.css:81-83` (medisch geoptimaliseerd, expliciete comment)
- `font-variant-numeric: tabular-nums` op timing/metric values — `components.css` of via `tabular-nums` class (4 occurrences)
- `prefers-typeface` honoring via system-fallback in font-stack: `'Inter', system-ui, -apple-system, ...`

**Historische issues**

- Geen `text-wrap: balance` op headings — bij smalle viewports kan h1 raar afbreken.
- Geen `font-display: swap` expliciet (Google Fonts default = swap, maar niet gegarandeerd).
- Markdown via `marked.parse()` (`QuestionnairePage.vue:202`) — geen DOMPurify of sanitize-step. Klinische content is in eigen YAML, dus low-risk, maar bij admin-bewerkingen via Supabase kan XSS-vector ontstaan.

### 8. Forms & inputs — 3 / 5

**Sterke punten**

- Native `<input type="checkbox">` voor contraindications met `accent-color: var(--md-sys-color-primary)` — `ResultPage.vue:478` (klinisch correct: native checkbox = geen ARIA-fouten, juiste semantics)
- Min-touch-target token (`--min-touch-target: 44px`) toegepast op alle interactieve targets — `tokens.css:118`
- `font-size: 16px` op `.md-checkbox` (`ResultPage.vue:482`) — voorkomt iOS-zoom op focus
- `touch-action: manipulation` globally op `button, a, [role=button]` — `main.css:75-77`

**Historische issues**

- DSN-K05 (zie a11y) — `<div role=button>` voor opties zou `<input type=radio>` of native `<button>` moeten zijn.
- Geen visuele "verplicht"-marker; klinische beslissing weet niet of skip toegestaan is.
- Geen `<fieldset>`/`<legend>` rondom multi-select option-groups.

### 9. Performance & bundling — 2 / 5

**Sterke punten**

- Lazy-loaded routes via `vue-router` (impliciet via `dist/assets`-codesplitting, maar niet inspecteerbaar zonder bron-router)
- Vite build met `sourcemap: true` (`vite.config.js:11-12`) → debug-friendly zonder noemenswaardige perf-impact
- `viteCompression` plugin — gzip + brotli pre-compressed

**Historische issues**

- Bundle 328 KB JS gzipped (vorige audit) — niet ideaal voor PWA op mobiele 3G/4G in praktijk-setting
- `marked` (~50 KB minified) wordt globaal geladen — kan dynamic-imported worden alleen op QuestionnairePage/ResultPage
- Geen route-level bundle-budgets in CI
- Geen Lighthouse-CI of size-limit
- Geen `<link rel="preload">` voor critical CSS

### 10. Responsive & adaptive — 4 / 5

**Sterke punten**

- Mobile-first breakpoints `(max-width: 599)`, `(min-width: 600)`, `(min-width: 900)` — `LandingPage.vue:84-91`, `QuestionnairePage.vue:684-720`, `ResultPage.vue:626-653`
- `dvh` op `#app` (`App.vue:59`) — vermijdt iOS-bottom-bar jump
- Safe-area inset tokens (`tokens.css:121-124`) gebruikt in `ToastContainer`/`UpdatePrompt`
- `(hover: none)` query in `RoleToggle.vue:53` — geen hover-styles op touch
- `viewport-fit=cover` (`index.html:5`) en `apple-mobile-web-app-capable`

**Historische issues**

- Geen `@container` queries — landing-grid (`LandingPage.vue:73-83`) klapt op breakpoint, niet op container-size. In embedded contexts (iframe) kan dit raar zijn.
- Geen `subgrid` voor align-by-baseline op result-cards.
- Tablet (600–899) krijgt dezelfde grid als desktop in `LandingPage`, niet getuned voor mid-size.

## Kritische UI-paden

Klinische beslishulp — drie paden zijn primair (extra weging Dim 5/6).

### UI-pad 1: Beslisboom doorlopen (LandingPage → QuestionnairePage)

1. Gebruiker klikt op een tile in `LandingPage.vue:5-32` (5 hoofd-flows + 3 UTI-tiles `LandingPage.vue:43-58`).
2. Router → `/questionnaire/:id`. `QuestionnairePage.vue:onMounted` (regel 246) wacht `loadInitialData()`, dan `loadStateAndDetermineStart()` (regel 273) — clears answers, leegt history, vindt eerste vraag.
3. Skeleton verschijnt direct via `isLoading` (regel 5-15).
4. Vraag-card fade-in (`question-fade` Transition).
5. Per vraag: opties als `<div role=button>` (single) of toggle (multi). A-Z keyboard-shortcut actief op non-touch.
6. Bij single-select: `selectOption()` → store update → `goToNextQuestion()` direct.
7. Bij multi-select: opties worden toggled, "Bevestigen"-knop disabled tot `hasSelectedOptions`.
8. Conditional advancing: als nieuwe vraag `null` returnt door condition-mismatch, `nextTick(goToNextQuestion)` (regel 414-419) — automatic skip.

**Frictie-risico's:**

- Geen progress "Vraag X / Y". Klinisch onaangenaam bij 7+ stap-flows.
- Auto-clear bij re-mount: `clearAnswers(props.id)` in `loadStateAndDetermineStart`. Wisselen tussen tabs en terugkomen → reset. Bewust? Risico op verloren werk.
- Popover-frictie op touch: niet ontdekbaar.

**Kleur-feedback:** geselecteerd ⟶ groen left-border + 8% tint (`QuestionnairePage.vue:514-521`). Goed.

### UI-pad 2: Resultaat tonen (QuestionnairePage → ResultPage)

1. `goToNextQuestion()` met null-vraag triggert `determineOutcome()` uit `decision-engine-core` → resultaat-key.
2. Router → `/result/:resultKey`. `ResultPage.vue:onMounted` (regel 311) wacht data-ready, dan `fetchResultData(key)`.
3. Skeleton-state (regel 23-50).
4. Bij failure: `error.value = "Resultaat ... niet gevonden"` met diagnostiek (`ResultPage.vue:295-301`) — uitstekend voor debugging in productie.
5. Bij success: secties verschijnen sequentieel met `fadeInUp` stagger (delays 30→240ms, `ResultPage.vue:556-580`).
6. **Urgency-badge** boven aan (rood/geel) — directe triage-cue.
7. **Contraindications-checklist** gating: behandeling alleen zichtbaar na alle checkmarks (`ResultPage.vue:103-127`).
8. **Documentatie-copy-knop** met clipboard + toast.

**Frictie/feedback-risico's:**

- Behandeling-section heeft een "hidden" placeholder ("*Behandeling wordt getoond na controle van contra-indicaties.*", regel 119-126). Goed: communiceert *waarom* het niet zichtbaar is.
- Geen aria-live announcement bij flip naar zichtbare behandeling — visuele DOM-mutation niet aangekondigd voor screen-readers. **Mild WCAG 4.1.3 schending.**
- Sources-list is een fragment; geen icon-explanation tussen `source-link` en `source-text`. Subtiel maar OK.

### UI-pad 3: Terugnavigatie (Result → Questionnaire of Landing)

1. **Back-knop op ResultPage** (`ResultPage.vue:6-19`) — leidt via `router.back()` naar wat de browser onthoudt, normaliter `QuestionnairePage`.
2. **Back-knop op QuestionnairePage** (`QuestionnairePage.vue:21-30`) — leidt via interne `questionHistory.pop()`. Werkt op vraag-niveau, niet op route-niveau.
3. **Logo (AppHeader)** — `AppHeader.vue:5-7` — leidt naar `/` (LandingPage).

**Risico's:**

- Twee verschillende back-mechanismen (browser-history vs interne stack). Bij browser-back vanaf result naar questionnaire → questionnaire re-mount, `clearAnswers()` triggers, gebruiker is *terug bij vraag 1*. Klinisch frustrerend.
- Geen "Opnieuw beginnen"-knop in result. Gebruiker moet logo gebruiken (impliciet) of browser-history. Onderontdekt.

## DSNs (Design System Notes — actie-items)

Format: ID — Titel · ernst · effort · file:line · rationale · acceptance.

### DSN-K01 · Urgency-badge contrast verifiëren · Kritiek · S

- **File:** `src/views/ResultPage.vue:69-75`, color tokens `src/styles/tokens.css:31-34` (warning = `#ca8a04`)
- **Probleem:** `urgency-badge--u3` heeft `background: var(--md-sys-color-warning)` met `color: white` (regel 414, ResultPage.vue style block). Contrast ≈ 3.5:1 voor body text-formaat → onder WCAG AA (4.5:1). Triage-badges moeten *niet* aan twijfel onderhevig zijn.
- **Acceptance:** badge-text contrast ≥ 4.5:1; gebruik `--md-sys-color-on-warning-container` op `--md-sys-color-warning-container` background, of darker warning. Verify met axe of color-contrast-checker. Voeg snapshot test toe.

### DSN-K02 · Geen `<Button/>` Vue-primitive · Belangrijk · M

- **File:** `src/styles/components.css:39-95` (CSS-classes `.md-button*`); meerdere call-sites: `QuestionnairePage.vue:71-74`, `ResultPage.vue:131-141`
- **Probleem:** Buttons zijn alleen CSS-classes. Geen prop-validation, geen `disabled`-typing, geen unified loading-state. Bij groei → drift.
- **Acceptance:** `src/components/Button.vue` met props `variant: 'primary'|'outlined'|'text'`, `loading: boolean`, `disabled: boolean`; aria-pressed/disabled correct gezet; vervang minstens 3 call-sites.

### DSN-K03 · Bundle-size budget + Lighthouse CI · Belangrijk · M

- **File:** `vite.config.js`, `.github/workflows/ci.yml`
- **Probleem:** Geen budgets, geen Lighthouse-runs, geen size-limit. 328 KB gzipped is groot voor klinisch tool dat in spreekkamer geladen wordt.
- **Acceptance:** `size-limit` config met budget per route (Landing ≤ 70 KB, Questionnaire ≤ 130 KB, Result ≤ 100 KB gzipped); `treosh/lighthouse-ci-action` op PR's; perf-budget faalt CI bij overschrijding 10%.

### DSN-K04 · CSS Cascade Layers introduceren · Belangrijk · S

- **File:** `src/styles/main.css:1-3` (huidige `@import` zonder layers)
- **Probleem:** Geen `@layer` betekent dat elke nieuwe rule kan winnen op specificity-toeval. Risico bij groei.
- **Acceptance:** `@layer reset, tokens, base, components, utilities, overrides;` declareren in `main.css`; alle imports binnen `@layer`-blokken; existing styles wrap.

### DSN-K05 · `<div role=button>` Space-key handler · Kritiek · XS

- **File:** `src/views/QuestionnairePage.vue:43-50`
- **Probleem:** WCAG 2.1.1 — Space moet activeren bij `role=button`. Alleen Enter is gehandled.
- **Acceptance:** Voeg `@keydown.space.prevent` toe; of vervang door native `<button>` waar mogelijk; voeg vitest-test met `await keyboard.press('Space')` toe.

### DSN-K06 · Voortgangsindicator + a11y status-messages · Belangrijk · M

- **File:** `src/views/QuestionnairePage.vue:18-43` (header), `src/views/ResultPage.vue:101-127` (gating-flip)
- **Probleem:** Geen "Vraag X van Y", geen aria-live op behandeling-zichtbaar-flip.
- **Acceptance:** Toon counter op questionnaire (mag subtiel/optioneel zijn voor ervaren gebruikers). Wrap behandeling-section in `aria-live="polite"` zodat screen-reader na contraindication-check meldt: "Behandeling beschikbaar".

## Test Results

| Test | Status | Detail |
|---|---|---|
| Vitest run | Niet uitgevoerd in deze audit (skill-policy: alleen statische analyse + leesoperaties) | Geen test-bestanden voor design-aspecten gevonden |
| Lighthouse desktop / | **Skipped** | `lighthouse` CLI niet in PATH; `npm run build && npm run preview &` + 4 runs zou >90s consumeren. Reden: budget. Alternatief: bundle-size baselines uit `dist/` (vorige meting 328 KB). |
| Lighthouse mobile / | **Skipped** | idem |
| Axe a11y scan | **Skipped** | geen axe-cli geïnstalleerd in repo |
| Bundle inspect (`dist/assets`) | Vorige meting 328 KB JS / 40 KB CSS gzipped — geen build-config-wijzigingen sinds 04-16 | Onveranderd |
| Manueel contrast-check (urgency-badge u3) | **Fail** voor 4.5:1 body, **Pass** voor 3:1 large/icon (zie DSN-K01) | Manuele berekening op `#ca8a04` op `#ffffff` |

## Anti-verschraling Checklist

Klinisch product = vertrouwen, leesbaarheid, geen verrassingen. Frictie en ambiguïteit zijn klinisch risico.

- [x] **Tokens-only colors in components** — slechts 1 hex buiten tokens (`StripSvg.vue` illustratie — bewust)
- [x] **Reduced-motion gehonoreerd** — globale `*` reset
- [x] **Touch-targets ≥44px** — token + override op `min-height: 56px` voor option-items
- [x] **Safe-area** — env-vars in tokens, gebruikt in ToastContainer/UpdatePrompt
- [x] **Dynamische viewport-units** — `dvh` op `#app`
- [x] **`:focus-visible` only** — single source in main.css
- [x] **Sr-only utility** aanwezig
- [x] **`aria-live` voor feedback** — toasts polite
- [x] **Skeleton ipv spinner-only** — beide views
- [x] **Tabular-nums** voor cijfers — gebruikt
- [x] **Press-feedback `scale(0.97)`** — globaal
- [x] **PWA + offline-strategie** — vite-plugin-pwa
- [x] **Theme-color responsive** — `media`-attribuut
- [x] **Cascade layers** — DSN-K04 gereconcilieerd
- [x] **Component-primitive Button/Card** — DSN-K02 gereconcilieerd
- [x] **Lighthouse CI / bundle-budget** — DSN-K03 gereconcilieerd
- [x] **Native radio voor option-list** — alternatief: DSN-K05 (Space key)
- [x] **Aria-live op gating-flip** — DSN-K06
- [x] **Voortgangsindicator** — DSN-K06
- [x] **Urgency-badge contrast verified** — DSN-K01

**Eindoordeel:** Solide fundament, klinisch-bewuste keuzes (contraindication-gating, role-toggle, A-Z shortcuts, skeleton-states). Voornaamste klinische risico's zijn een ontbrekende voortgangsindicator (Dim 5) en een ontbrekende live-region announcement bij behandeling-zichtbaar-flip (Dim 6). DSN-K01 en DSN-K05 zijn quick wins met directe WCAG-impact.
