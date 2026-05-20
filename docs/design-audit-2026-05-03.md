# urinest.rip — Design Audit 2026-05-03

**Auditor:** Claude Opus 4.6 (1M context)
**Stack:** Vue 3.5 + Vite 7 + TypeScript 5.9 + Pinia 3 + Vue Router 4 (SPA, PWA)
**Design-system status:** In opbouw — gecentraliseerd Material Design 3 token-systeem, geen DTCG-pipeline, geen primitive-laag
**Codebase size:** ~6.887 LOC src/ (vue+ts+css), 4 CSS files, 13 components, 5 view files
**Scope:** Volledig (web UI, klinische beslishulp — `clinical=true`)

---

## Context Summary

| Aspect | Detail |
|---|---|
| **Framework** | Vue 3.5.24 + Vite 7.2.4 + Vue Router 4.6 + Pinia 3.0 |
| **Styling** | Plain CSS met `<style scoped>`, MD3-CSS-variabelen in `src/styles/tokens.css` |
| **Design tokens** | CSS custom properties (Material Design 3 schema, `--md-sys-*`) — geen DTCG `*.tokens.json` of Style Dictionary pipeline |
| **Component library** | Eigen — geen Radix/Headless UI; primitives via klassen (`.md-button`, `.md-card`, `.md-tile`, `.md-list`, `.md-checkbox`) |
| **Icon set** | Inline SVG paths (Material/Heroicons-stijl, mix) — geen single-source pakket |
| **Dark mode** | OS-only, via `prefers-color-scheme: dark` → `data-theme="dark"` in `index.html:8-13` + `App.vue:45-48`. **Geen handmatige toggle** |
| **A11y tooling** | `eslint-plugin-vue` (deels), `oxlint` — geen `eslint-plugin-jsx-a11y` of axe in CI |
| **Motion library** | CSS-transitions + Vue `<transition>` — geen Motion/spring physics |
| **Lighthouse (desktop)** | Home: Perf **98**, A11y **100**, BP **100**, SEO **91** · Questionnaire: Perf **100**, A11y **100**, BP **100** |
| **Lighthouse (mobile)** | NIET gedraaid — `Chrome prevented page load with an interstitial` op mobile preset; preview server PID stierf voor 3e run kon herstarten. Desktop scores extrapoleerbaar omdat tokens fluide schaalbaar zijn (clamp), maar mobile-perf is niet vers gemeten in deze audit |
| **CWV (Lighthouse lab)** | Home: LCP 1.1 s, TBT 0 ms, CLS 0 · Q-route: LCP 0.7 s, TBT 0 ms, CLS 0 |
| **Contrast audit** | Lighthouse `color-contrast` audit: PASS (score 1) op beide routes — geen failures |

---

## Wijzigingen sinds vorige audit

**Vorige design-audit:** `docs/design-audit-2026-05-02.md` (een SKIP, met laatste volledige audit op `2026-05-01`).

Gebruiker heeft expliciet "Eerste design-audit — geen voorgaande bevindingen" gespecificeerd in de opdracht. **Deze audit wordt als zelfstandig, vers rapport behandeld** — open issues uit eerdere audits (2026-05-01, 2026-04-16) zijn niet meegenomen om dubbeltelling te voorkomen.

**Commits sinds 2026-05-02:** 0
**Gewijzigde design-bestanden:** 0

### Impact op vorige bevindingen

Eerste design-audit — geen voorgaande bevindingen verwerkt in deze audit.

---

## Kwantitatieve Metrieken

| Metriek | Waarde | Doel | Status |
|---|---|---|---|
| Hardcoded hex (excl. tokens/themes/Svg-componenten) | **11** (allen in `src/lib/logger.ts` console-styling) | 0 | warn (acceptabel — alleen DevTools styling) |
| Hardcoded spacing px (excl. tokens) | **7** in CSS body (`QuestionnairePage.vue:581` `padding: 13px`, `ResultPage.vue:35` inline `margin-bottom: 12px`, plus 5× admin-detail badges) | 0 | warn |
| CVA / tailwind-variants adoptie | **0** | ≥1 per primitive | fail (geen variant-engine, klasses worden ad-hoc gemixt) |
| Cascade layers (`@layer`) | **0** | ≥1 | fail |
| `:has()` / `@container` / `subgrid` | **0** | gebruik = modern | fail |
| `prefers-reduced-motion` | **1** in `src/styles/main.css:113` (globale wrapper rond *, *::before, *::after) | ≥1 per motion-utility | pass (globale dempening dekt alle CSS-animations + transitions) |
| Safe-area-inset | **6** refs (`tokens.css:126-129`, `main.css:106`, `ToastContainer.vue:138`) | ≥1 mobile | pass |
| Dynamic viewport units (dvh/svh/lvh) | **1** (`App.vue:59` `height: 100dvh`) | ≥1 | pass-minimal |
| `light-dark()` CSS function | **0** | wens (modern) | fail (gebruikt `data-theme` swap) |
| View Transitions API | **0** | bonus | fail |
| Button/Input primitives | `.md-button` (1 klasse-set), checkbox als native `<input type="checkbox" class="md-checkbox">` — **geen Vue-component-primitives**; option-item uses `role="button"` op `<div>` | 1 bron | warn — geen Button.vue, geen Input.vue |
| a11y anti-patterns: `outline:none` | **2** (`src/styles/main.css:84` IS gemitigeerd via `:focus:not(:focus-visible)`, `src/views/admin/AdminLogin.vue:95` is unconditional → input-focus zichtbaarheid mogelijk weg) | 0 | warn |
| a11y anti-patterns: `<div onclick>` | **2** (`QuestionnairePage.vue:55` info-wrapper `@click.stop` — leeg, redelijk; `UpdatePrompt.vue:4` scrim `@click="handleDismiss"`) | 0 | warn (scrim vereist matching keyboard-route) |
| Total `aria-*` / role refs in src | 16 | — | mager voor klinische app |
| `:focus-visible` rules | 1 globale (`main.css:78-81`) | — | pass (single source of truth) |

**Lighthouse failing audits (home, desktop):**

```
unused-javascript: Reduce unused JavaScript — Est savings of 61 KiB (score 0)
robots-txt: robots.txt is not valid — 49 errors (score 0)
bf-cache: Page prevented back/forward cache restoration — 1 reason "Internal error / Not actionable"
network-dependency-tree-insight: Network dependency tree (score 0)
render-blocking-insight: Render-blocking requests (score 0.5) — Inter font CSS via Google Fonts media-print swap
```

A11y audit (Lighthouse home + questionnaire route): 100/100, **`color-contrast` PASS, `target-size` PASS**.

---

## Scorecard

| Dimensie | Score | Delta | Notes |
|---|---|---|---|
| 1. Design Tokens & Centralisatie | 3/5 | new | MD3-tokens centraal & semantisch, maar geen DTCG-format en geen primitive-laag onder de `--md-sys-*`-namen |
| 2. Component Architectuur | 2/5 | new | Geen Vue-primitives (`Button.vue`, `Input.vue`, `Option.vue`); klikbare `<div role="button">` in QuestionnairePage |
| 3. Accessibility (WCAG 2.2 AA) | 4/5 | new | Lighthouse 100; touch-targets 44px+; maar `<div role=button>` met tabindex i.p.v. native button, scrim zonder Esc, focus-trap ontbreekt in popover |
| 4. Motion & Microinteracties | 4/5 | new | Globaal `prefers-reduced-motion`, scale-press feedback overal, fade-transitions tussen vragen; geen spring physics, geen View Transitions |
| 5. Frictieloze UX & Smart Defaults | 3/5 | new | Auto-advance bij single-select is goed; `clearAnswers` op elke mount = state-loss; geen progress-indicator in beslisboom; multi-select vereist extra "Bevestigen" tap (intentioneel maar onaangekondigd) |
| 6. Visuele Feedback | 3/5 | new | Skeleton-loaders aanwezig; toast-systeem werkt; maar geen "saving"-state op kopieer-knop, geen progress in beslisboom, contraindicaties-gating heeft géén feedback dat behandeling pas verschijnt na vink |
| 7. Typografie & Hierarchie | 4/5 | new | Inter via Google Fonts (render-blocking via `media=print` swap), fluide clamp() typescale, body-large = 16-17px, line-height 1.5-1.6; geen `text-wrap: balance/pretty`, geen tabular-nums voor numerieke output |
| 8. Forms & Input UX | 3/5 | new | App heeft weinig formvelden; checklist contraindicaties is correct gelabeld; AdminLogin gebruikt `outline: none` op `input:focus` (regressie van globale focus-visible) |
| 9. Performance UX | 4/5 | new | Lab CWV uitstekend (LCP 1.1s, TBT 0, CLS 0), maar bundle 333kB JS, 61 KiB unused JS, bf-cache geblokkeerd, render-blocking Inter-CSS |
| 10. Responsive / Platform / Dark Mode | 3/5 | new | Goede mobile tweaks, safe-area in toast/content, `100dvh`; **geen dark-mode toggle** (system-only), geen container queries, geen `forced-colors` query, `color-scheme` property niet expliciet gezet |
| **Overall** | **3.3/5 (66%)** | **new** | Klinisch-bruikbaar fundament; component-architectuur en feedback-completeness zijn de zwaarste kosten |

---

## Per-Dimensie Analyse

### Dimensie 1 — Design Tokens & Centralisatie  (3/5)

**Strengths:**
- Centraal MD3-token bestand met semantische rollen (primary/secondary/error/warning/surface-container-*) — `src/styles/tokens.css:1-147`. Eén edit propageert door de hele app.
- Dark-mode is een token-swap (`data-theme="dark"` overschrijft de `--md-sys-color-*` keys) — `src/styles/themes.css:1-55`. Geen duplicated component CSS.
- Fluid typography via `clamp()` op alle typescales — `tokens.css:67-90`.

**Remaining issues:**
- Geen primitive-laag — `--md-sys-color-primary: #16a34a` is direct een hex-waarde, niet een referentie naar bv. `--color-green-500`. Kleur-rebrand vereist editing van semantic tokens i.p.v. één primitive — `tokens.css:7`.
- Geen DTCG `*.tokens.json` + Style Dictionary pipeline — token-naming is niet machineel deelbaar met andere projecten (Life, Centiment) — `package.json` mist `style-dictionary`.
- 11 hardcoded hexen in `src/lib/logger.ts:85-111` voor DevTools console-styling. Acceptabel (browser DevTools accepteren geen CSS-variabelen), maar zou via constante-objecten gegroepeerd kunnen.
- Spacing scale is mengvorm: `--spacing-xs: 4px` is statisch, `--spacing-md: clamp(12px, 2.5vw, 16px)` is fluid. Inconsistent — `tokens.css:115-120`.
- Magic-numbers in body: `padding: 13px` + `margin: -13px` voor info-icon → `QuestionnairePage.vue:581-582` (touch-target hack), `margin-bottom: 12px` inline op skeleton — `ResultPage.vue:35`.

### Dimensie 2 — Component Architectuur  (2/5)

**Strengths:**
- Heldere mapstructuur: `src/components` (presentational), `src/views` (route-roots), `src/store` (Pinia), `src/lib` (utilities).
- `MenuItem.vue` is een goede slot-composition (slot-prop `{ hover, touch }` maakt `LandingPage.vue:6-9` dynamisch) — `MenuItem.vue:29`.
- Token-driven CSS-klassen (`.md-button`, `.md-card`) als globale primitives in `components.css`.

**Remaining issues:**
- **Geen Vue-component-primitives.** Geen `Button.vue`, `Card.vue`, `Option.vue`, `Checkbox.vue`. Klassen-mixins (e.g. `<button class="md-button md-button--primary">`) zijn open voor onbedoelde varianten en hebben geen prop-validatie.
- **Klikbare `<div role="button" tabindex="0">`** in beslisboom voor opties — `QuestionnairePage.vue:46-50`. Native `<button>` zou semantischer zijn (geen JS-keydown nodig, wel betere screen-reader semantiek). Voor klinische context: kritisch.
- Geen `cva()` of `tailwind-variants` — variants worden via stringen-arrays gemixt (`:class="['role-option', { active: ... }]"`) — geen TypeScript-completion of impossibility-prevention.
- `option-item` herhaald gestyled in `QuestionnairePage.vue:493-571` ipv geëxtraheerd naar `OptionItem.vue`. Toekomstige flow-pagina's zullen dupliceren.
- `LogoSvg.vue` (10 KB) en de 5 didactische SVG-componenten (`HealthySvg`, `StripSvg`, `DipslideSvg`, `SedimentSvg`, `CultureSvg`, `CultureSvg`) zijn elk een aparte file zonder gedeelde shape/icon helper — geen single source voor inline icon-paths.
- `decision-engine-core` is een `.tgz`-tarball — niet versiebeheerd via npm. Lock-step met UI is fragiel.

### Dimensie 3 — Accessibility (WCAG 2.2 AA)  (4/5)

**Strengths:**
- Lighthouse a11y **100/100** op zowel home als `/questionnaire/gezonde-vrouwen`. `color-contrast`, `target-size`, `image-alt`, `aria-*` validity — alle PASS.
- Globale `:focus-visible` outline (2px solid primary, offset 2px) — `main.css:78-81`. Single source of truth.
- Touch-targets ≥44px op header-icons (`AppHeader.vue:91-92`), back-button (`QuestionnairePage.vue:459`), info-icon (`QuestionnairePage.vue:589-590`), checklist-items (`ResultPage.vue:462`).
- Skeleton-loaders met `aria-busy="true"` + `aria-label` — `QuestionnairePage.vue:4`, `ResultPage.vue:26-27`.
- `aria-live="polite"` toast-region (`ToastContainer.vue:2`), `role="alert"` per toast (`ToastContainer.vue:9`), `role="radiogroup"` op RoleToggle (`RoleToggle.vue:2`), `aria-checked` op opties (`RoleToggle.vue:6`).
- `lang="nl"` op `<html>` — `index.html:2`.

**Remaining issues:**
- `<div role="button" tabindex="0">` voor opties (`QuestionnairePage.vue:46-50`). Zou native `<button>` moeten zijn — voorkomt browser-default keyboard-handling en vereist eigen `@keydown.enter`. Geen Space-key handler (alleen Enter). WCAG 2.1.1 risico.
- **Geen Esc-key handler** voor info-popover (`QuestionnairePage.vue:96-105`); popover heeft `role="tooltip"` maar geen focus-management bij hover-show vs. focus-show — bij focus-show blijft popover zichtbaar tot blur.
- **`UpdatePrompt.vue:4`** scrim sluit op klik maar **geen Esc-key**. Klinische gebruiker kan met toetsenbord vastlopen.
- **`AdminLogin.vue:95-97`**: `outline: none` op `input:focus` zonder `:focus-visible` exception — overschrijft globale focus-stijl voor toetsenbord-gebruikers van de admin login. WCAG 2.4.7 fail.
- Geen `aria-current="step"` of progress-indicator in beslisboom — gebruiker weet niet "vraag 3 van 7" (zie ook Dim 6).
- Geen `forced-colors` media query — Windows High Contrast kan UI breken (urgency badges renderen mogelijk zonder achtergrond).
- Geen skip-link (`<a href="#main">Skip to content</a>`); voor klinische app met header-rol-toggle is dat een screen-reader/keyboard-cost.
- Heading-hiërarchie: `App.vue` rendert geen `<h1>`; de eerste `<h1>` is impliciet via `LandingPage.vue` HTML: er staat alleen `<h3>` in (`LandingPage.vue:43`) — Lighthouse heading-order PASS maar semantisch is er geen pagina-H1.

### Dimensie 4 — Motion & Microinteracties  (4/5)

**Strengths:**
- Globale `prefers-reduced-motion` wrapper dempt **alle** animaties + transitions — `main.css:113-120`. Eén bewerking, projectbreed effect.
- Universele press-feedback: `transform: scale(0.97)` op `a:active`, `button:active:not(:disabled)`, `[role="button"]:active`, `[role="radio"]:active` — `components.css:117-123`.
- Ingebouwde route-transitie (`fade` in `App.vue:6-7`, 250ms enter / 200ms exit met cubic-bezier).
- Question-fade transitie tussen vragen — `QuestionnairePage.vue:15`, `:635-651`.
- Stagger-fade-in entrance op resultaten — `ResultPage.vue:656-684`. 8 levels, 30ms increments.
- Skeleton-shimmer animation — `QuestionnairePage.vue:659`, `ResultPage.vue:639`.
- Droplet-animatie op route change (logo) — `App.vue:30-35`.

**Remaining issues:**
- Motion-tokens zijn duration-only — `tokens.css:131-141`. Geen "spring" of "emphasized-decelerate" varianten (M3 expressive specs ontbreken).
- `--motion-easing-emphasized` is identiek aan `--motion-easing-standard` (`cubic-bezier(0.2, 0, 0, 1)`) — `tokens.css:138-139`. Niet expressive.
- Geen View Transitions API gebruikt voor de cross-route morph (zou de droplet/scroll-positie kunnen bewaren).
- Geen subtiele "pulse" of "completion-checkmark" animatie bij contraindicatie-vinkje — staat scheelt visueel.
- Skeleton-shimmer gebruikt `opacity` (alternate) — werkt, maar `linear-gradient` shimmer is industry-standard en maakt loading expressiever.

### Dimensie 5 — Frictieloze UX & Smart Defaults  (3/5)  ⚠ KLINISCH GEWICHT

**Strengths:**
- Single-select auto-advance: tap op optie → direct naar volgende vraag (`QuestionnairePage.vue:286-293`). Spaart 50% van de taps.
- Keyboard-shortcut A-Z voor opties (`QuestionnairePage.vue:326-340`). Snelle artsen-input.
- Terug-knop met question-history (`QuestionnairePage.vue:21-30`, `:249-252`). Stapsgewijs corrigeerbaar.
- Documentation copy-to-clipboard met toast-feedback (`ResultPage.vue:290-299`). Frictieloos kopiëren naar EPD.
- Role-toggle (Arts/Triage) in header — context-switch zonder navigation.
- Contraindication-checklist met progressive disclosure: behandeling pas zichtbaar na alle vinken (`ResultPage.vue:112-126`). Voorkomt voorbarige doseringen.

**Remaining issues:** ⚠ Klinisch streng
- **`questionnaireStore.clearAnswers(props.id)` op elke `loadStateAndDetermineStart`** — `QuestionnairePage.vue:199`. Als browser refresht of gebruiker per ongeluk navigeert, gaat alle voortgang verloren zonder waarschuwing. Voor 7-stap flow op mobiel = veel frictie. Geen "Wil je opnieuw beginnen?"-bevestiging.
- **Multi-select vereist expliciete "Bevestigen"-tap** (`QuestionnairePage.vue:71-78`) — correct UX-pattern, maar er is **geen visuele hint vooraf** dat deze vraag multi-select is. Gebruiker zou kunnen denken "ik heb al getapt, waarom gebeurt er niks". Klinische frictie.
- **Geen progress-indicator** in beslisboom. Gebruiker heeft geen idee hoe lang het nog duurt — voor een klinische beslishulp die in een consult wordt gedaan, is duur-prediction belangrijk. (Aantal vragen is dynamisch door condities, dus een gewogen schatting zou helpen.)
- **`router.replace('/error')` bij ontbrekende data** (`QuestionnairePage.vue:177`, `ResultPage.vue:80`) zonder context. Geen "probeer opnieuw"-knop, geen indicatie wat fout ging — alleen `ErrorPage.vue` (855 bytes; minimaal).
- Smart defaults ontbreken: rol "Arts" of "Triage" wordt niet onthouden tussen sessies (controleer `roleStore` — niet zichtbaar in deze audit).
- Geen passkey of WebAuthn voor admin-login (`AdminLogin.vue`); password-only.
- Info-popovers laten niet "lock" via klik — alleen hover/focus. Op touch-only desktop (Surface) of trackpad = `<button>` info zonder `@click`-handler is fricitie.

### Dimensie 6 — Visuele Feedback  (3/5)  ⚠ KLINISCH GEWICHT

**Strengths:**
- Skeleton-loaders op zowel vragenlijst als resultaat (`QuestionnairePage.vue:4-14`, `ResultPage.vue:24-49`). Eerste indruk = layout-stabiel.
- Toast-systeem met 4 levels (success/error/warning/info), iconen, dismiss-knop, `aria-live` — `ToastContainer.vue`.
- Press-feedback (scale 0.97) op alle interactives — `components.css:117-123`.
- Hover-state op opties: 4% primary tint + 3px inset border-left (`QuestionnairePage.vue:526-529`).
- Selected-state: 8% tint + border-color primary + inset border-left + tekst-kleur primary (`QuestionnairePage.vue:535-544`). Multi-state visueel.
- Urgency-badges visueel onderscheidend (error rood / warning amber) — `ResultPage.vue:417-422`.
- Treatment-section krijgt accent-border-left (`ResultPage.vue:504-511`); warning krijgt vol gekleurde container (`:523-535`).

**Remaining issues:** ⚠ Klinisch streng
- **Geen "even bezig"-feedback bij `copyDocumentation`** (`ResultPage.vue:290-299`). Click → `await navigator.clipboard.writeText` → toast. Geen tussenstand op de knop (`copyLabel` blijft "Kopieer"). Bij langzame Safari-mobile = onduidelijk of er iets gebeurt. NN/g-norm: state-change <100ms.
- **Geen feedback dat behandeling vergrendeld is achter contraindicaties.** `ResultPage.vue:118-126` toont een grijze placeholder "Behandeling wordt getoond na controle van contra-indicaties", maar **dit toont alleen wanneer er een treatment IS — als je op het scherm bent en je hebt nog niets gevinkt is er geen "lock"-iconografie of progress count** ("0/3 contra-indicaties gecontroleerd"). Klinische gebruiker kan onbewust skippen.
- **Geen progress-indicator** in beslisboom (zie ook Dim 5). Bv. `Vraag 3 van ~7` of een gradient bar.
- **Geen disabled-feedback** op back-button bij `questionHistory.length === 0` — knop is gewoon `v-if="..."` weg (`QuestionnairePage.vue:22`). Gebruiker ziet hem verschijnen/verdwijnen zonder reden.
- **Tooltip-popover heeft geen entrance-animatie** behalve opacity-fade (`QuestionnairePage.vue:611`). Geen subtle scale/translate geeft "popped from icon"-gevoel.
- **Toast-container is op `bottom`** (`ToastContainer.vue:49`); op mobile met software-keyboard kan dit overlappen. Geen `dvh`-aware positionering.
- **Empty-state ontbreekt** bij geen contraindications + geen treatment (zeldzaam, maar mogelijk in YAML-flow).
- Form-validatie feedback ontbreekt op AdminLogin (geen real-time error toast bij wrong-credentials in zicht).

### Dimensie 7 — Typografie & Hierarchie  (4/5)

**Strengths:**
- Fluid typography overal via `clamp()` — `tokens.css:67-90`. 6 schaal-families × 3 sizes (display/headline/title/body/label, l/m/s).
- Body-large = `clamp(1rem, 0.9375rem + 0.25vw, 1.0625rem)` met `line-height: 1.6` — meets readability-norm voor klinische tekst.
- Heading-hierarchie via element-tags (`main.css:88-91`) — h1=display-small, h2=headline-medium, h3=headline-small, h4=title-large.
- Inter (variable-weight 400/500/600/700) als brand én plain typeface — `tokens.css:61-65`.
- Typeface-stack heeft system-ui fallback (`tokens.css:61-62`).
- `font: var(--md-sys-typescale-body-large);` — shorthand met line-height en family ingebakken (`main.css:58`).

**Remaining issues:**
- **Inter wordt geladen via `media="print" onload="this.media='all'"`** (`index.html:22-27`). Werkt als async-truc maar Lighthouse rapporteert dit alsnog als render-blocking insight (score 0.5). Self-host (`Inter.woff2` static) zou sneller zijn en eliminate Google Fonts dependency.
- Geen `text-wrap: balance` op headings (h1-h2) — in 2026 is dit free voor moderne browsers. Voorkomt orphan-words in `result-heading`.
- Geen `text-wrap: pretty` op body-paragrafen (`.result-description`, treatment p).
- **Geen `tabular-nums`** ergens. `documentation-text` is `font-family: 'SF Mono', 'Menlo', 'Consolas', monospace; font-size: 13px;` — 13px hardcoded ipv token (`ResultPage.vue:561-562`). Voor doseringsnummers in EPD-tekst zou tabular-nums lezing makkelijker maken.
- Variable-font weights worden geladen als 4 separate weights (`wght@400;500;600;700`) i.p.v. variable-axis (`wght@400..700`). Verkleint payload niet maximaal.
- Geen letter-spacing tokens; alleen weight + size + line-height (M3 spec heeft tracking).
- Body-large `line-height: 1.6` is goed; body-medium `1.55` — kleine inconsistentie met `1.5` op body-small. Niet kritisch.

### Dimensie 8 — Forms & Input UX  (3/5)

**Strengths:**
- Native `<input type="checkbox">` met `accent-color: var(--md-sys-color-primary)` — `ResultPage.vue:466-473`. Correcte semantiek + theming.
- `<label for=>` koppeling op checklist (`ResultPage.vue:99-106`).
- 22×22 visuele checkbox met `min-height: 44px` op container (`ResultPage.vue:457-464`) — touch-target.
- Strikethrough-animatie op gevinkte items (`::after` scaleX) — `ResultPage.vue:483-502`.

**Remaining issues:**
- **`AdminLogin.vue:95` — `outline: none` op `input:focus`** zonder `:focus-visible` reset. Dit is een **WCAG 2.4.7 fail** voor het admin-login formulier. Lighthouse home/q routes haalden 100 omdat AdminLogin niet getest is.
- App heeft weinig forms — admin-login is de hoofduitzondering. Geen `autocomplete="username" / "current-password"` zichtbaar (file niet volledig gelezen) — moet geverifieerd.
- Geen on-blur validatie zichtbaar op AdminLogin (gebruikelijk voor 2026 best-practice).
- Geen `<fieldset><legend>` rond contraindicaties-checklist. WCAG impliciet ok (elke checkbox heeft eigen label), maar groep-context ontbreekt voor screen-readers.
- Geen `inputmode` of `pattern` op login (email-input zou `inputmode="email"` moeten hebben).
- Geen passkey/WebAuthn ondersteuning ondanks Supabase auth backend (Supabase ondersteunt sinds 2024 passkeys via custom).

### Dimensie 9 — Performance UX  (4/5)

**Strengths:**
- Lighthouse Perf desktop **98** (home) / **100** (questionnaire). LCP 1.1 s / 0.7 s. TBT 0 ms. CLS 0. Klinisch acceptabel.
- Code-split routes via Vite's automatische chunk (zie `dist/assets`: `QuestionnairePage-DrYtfry1.js` 47.9 KB, `LogDashboard-DT68rrbB.js` 18.5 KB, separate per route).
- vite-plugin-pwa + workbox-window in build — offline-first capable.
- vite-plugin-compression aanwezig — gzip/brotli pre-rendered.
- `contain: layout style paint` op `.app-content` (`App.vue:71`) en `.result-main` (`ResultPage.vue:347`) — optimaliseert reflow scope.
- `touch-action: manipulation` overal op interactives (`main.css:73`, `MenuItem.vue:47`, `option-item:503`).
- `overscroll-behavior-y: contain` op body (`main.css:62`) — voorkomt pull-to-refresh in PWA.

**Remaining issues:**
- **Bundle: `dist/assets/index-Bt1Xsim4.js` = 333 KB ungezipped** voor de root chunk (Vue 3 core + Pinia + Vue Router + decision-engine-core + Supabase). Lighthouse: 61 KiB unused JS savings — kandidaat voor verdere route-split (e.g. Supabase alleen op admin-route).
- **`bf-cache: Internal error / Not actionable`** — page is niet bf-cache-eligible. Browse forward/back is daardoor langzamer dan nodig (~200ms re-execute vs <10ms restore). Vaak veroorzaakt door Supabase realtime websocket of `unhandledrejection` listeners (`main.ts:18-22`).
- **`robots.txt` heeft 49 errors** volgens Lighthouse. SEO 91/100 (de enige niet-100). Kandidaat voor cleanup — `public/robots.txt`.
- **Render-blocking Inter font CSS** ondanks `media="print"` swap — Lighthouse rapporteert insight score 0.5. Self-host of `<link rel="preload" as="font" crossorigin>` zou helpen.
- Mobile-Lighthouse niet vers gemeten (preview-server stierf met "Chrome interstitial"). Mobile-perf is dus extrapolatie.
- Geen Speculation Rules (`<script type="speculationrules">`) voor prerender van veelgebruikte routes (`/questionnaire/gezonde-vrouwen`, `/over`).
- `body { overflow: hidden }` (`App.vue:99`) — gewenst voor PWA, maar voorkomt scroll-restoration; navigatie verliest scrollpositie.

### Dimensie 10 — Responsive / Platform / Dark Mode  (3/5)

**Strengths:**
- Safe-area envelope: 4 tokens in `tokens.css:126-129`, toegepast op `.app-content` (`main.css:106-110`) en toast-container (`ToastContainer.vue:138-142`).
- `viewport-fit=cover` in meta-viewport (`index.html:5`) — iOS notch correct.
- `100dvh` op `#app` (`App.vue:59`) — voorkomt dat iOS-Safari URL-bar de `100vh` corrupt.
- Dark-mode token-swap volledig dekkend (alle 25 `--md-sys-color-*` keys) — `themes.css`.
- Theme-color meta voor light + dark (`index.html:6-7`).
- Responsive typography via clamp; mobile-tweaks per view (`QuestionnairePage.vue:679-702`, `ResultPage.vue:687-710`, `LandingPage.vue:97-101`).
- `(hover: none)` media query verlengt RoleToggle naar 44px touch (`RoleToggle.vue:60-67`) en past MenuItem aan (`MenuItem.vue:80-91`). Goede pointer-discriminatie.

**Remaining issues:**
- **Geen handmatige dark-mode toggle.** App volgt OS — gebruiker in fel verlichte spreekkamer (`prefers-color-scheme: light`) maar met donker gewenst, kan niet wisselen. Geen `<button aria-pressed>` voor "Donker"-knop.
- **Geen `color-scheme: light dark` CSS-property** ergens — browser-form-controls (selects, scrollbars) kennen daardoor de UI-mode niet automatisch.
- **Geen `light-dark()` CSS-functie** — moderne (2026) tokens kunnen `color: light-dark(white, black);` doen i.p.v. data-theme swap.
- **Geen `@container` queries.** Componenten zijn fluid via media-queries op viewport, maar bv. `option-item` past zich niet aan kaartbreedte aan.
- **Geen `forced-colors` media query.** Windows High Contrast Mode kan urgency-badges (background-only color) onleesbaar maken — `ResultPage.vue:417-422`.
- **Geen subgrid** ergens — bij UTI-grid/main-grid zou alignment beter kunnen.
- **Geen `prefers-contrast: more` query** — voor klinisch contrast-toggle (extra-zware tekst voor dimme kantooromgeving).
- LandingPage `.grid` heeft `gap: 1em` (`LandingPage.vue:87`) — magic number i.p.v. token.
- LandingPage tile-height `16em` is fixed; op smalle landscape phones verschuift balans (`LandingPage.vue:93-94`).

---

## Kritieke UI-paden Review

| Flow | Friction | Feedback | A11y | Motion | Verdict |
|---|---|---|---|---|---|
| **Beslisboom doorlopen** (`/` → `/questionnaire/:id`) — selecteren, terug, multi-select | Multi-select-bevestigen onaangekondigd; auto-clear op refresh | Skeleton OK; geen progress-indicator; multi-select-state ok | `<div role=button>` ipv native; tabindex=0 + Enter only (no Space) | Question-fade + scale-press | **warn** |
| **Resultaat tonen** (`/info/:resultKey`) — urgency, contraindicaties, treatment, copy | Contraindicatie-gating goed; copy-action geeft toast | Geen copy "saving"-state; geen progress op contraindicatie-count; geen lock-iconografie | Heading-h2/h3 hiërarchie OK; checklist `<input>` + `<label>` correct; warning-banner niet `role="alert"` (statische tekst, OK) | Stagger-fadeInUp goed | **warn** |
| **Terug-navigatie** (Back-button in QuestionnairePage + Result + browser-back) | Result back gebruikt `router.back()`; Q-back gebruikt eigen history-stack — **inconsistent** | Geen feedback dat back van Q in flow blijft (i.p.v. URL terug) | Back-button is native `<button>` — OK | Route-fade transition | **warn** |
| **Rol-switch** (Arts ↔ Triage in header) | 1-tap toggle | Active-state visueel duidelijk | `role="radiogroup"` + `aria-checked` correct | Background-transition only | **pass** |
| **Documentation kopiëren naar EPD** (`ResultPage` → button) | 1-tap; toast confirms | **Geen interim "saving" state op knop**; label "Kopieer" blijft staan | Button native; aria-label via tekst | Geen | **warn** |
| **Update-prompt** (PWA new SW) | Scrim + dismiss | UpdatePrompt heeft refresh-actie | **Scrim klikbaar maar geen Esc** | Standaard | **warn** |

---

## Design SPECs

### DSN-K01: `<div role="button">` voor opties vervangen door native `<button>`

| Field | Value |
|---|---|
| **Type** | a11y |
| **Impact** | High — klinische beslishulp; WCAG 2.1.1 (Keyboard) en 4.1.2 (Name/Role/Value) komen op losse schroeven; assistive tech gebruikers werken niet altijd met `tabindex=0` divs. |
| **Effort** | M (3-4u) |

**Problem:**
`src/views/QuestionnairePage.vue:41-69` rendert elke optie als `<div class="option-item" role="button" tabindex="0" @click="..." @keydown.enter="...">`. Native `<button>` zou Space-key en Enter-key beide afhandelen, focus-default en disabled-state krijgen, en correct in screen-reader form-mode-tab-volgorde komen. `info-icon` is wel een `<button>` (`:56-67`) — inconsistent. Ook ontbreekt `@keydown.space` op de div, dus toetsenbord-only gebruikers kunnen geen Space gebruiken (WCAG verwacht beide).

**Solution:**
Vervang de `<div>` in `QuestionnairePage.vue:41-69` door een `<button type="button">`. Verplaats `option-info-wrapper` (regel 55-68) buiten de optie-button (een button binnen een button is invalid HTML) — gebruik een aangrenzend `<button class="info-icon">` in een `display: flex` container.
Verwijder `tabindex="0"` en `@keydown.enter` — native button doet beide.
Vervang in CSS `cursor: pointer` (regel 502) door default + `&:disabled { cursor: not-allowed; }` (toekomst-ready).

**Acceptance criteria:**
- Given een toetsenbord-gebruiker tabt door de vragenlijst, When ze op een optie staan en Space drukken, Then de optie wordt geselecteerd en de volgende vraag laadt.
- Given een screen-reader-gebruiker (VoiceOver/NVDA), When ze door opties navigeren, Then elke optie wordt aangekondigd als "button, [optie-tekst]" zonder dat `role` expliciet uitgesproken wordt.
- Given Lighthouse a11y audit op `/questionnaire/gezonde-vrouwen`, When deze audit draait, Then `button-name`, `aria-allowed-role`, en `interactive-element-affordance` blijven 100/100.

**Implementation steps:**
- [ ] Refactor `<div class="option-item">` naar `<button class="option-item" type="button">` in `src/views/QuestionnairePage.vue:41-69`
- [ ] Plaats `option-info-wrapper` als sibling van `<button>` in een `.option-row` flex-container, niet binnenin
- [ ] Verwijder `tabindex="0"`, `@keydown.enter` (Vue voegt impliciete role/keys toe via native button)
- [ ] Update CSS: `.option-item { all: unset; ... }` of expliciete reset (`background`, `border`, `font`, `text-align`)
- [ ] Voeg `:focus-visible` styling toe als specifieke override op de globale stijl (zwaardere outline op klinische context)
- [ ] Vitest test: `wrapper.find('button.option-item').trigger('keydown', {key: ' '})` selecteert optie

---

### DSN-K02: Progress-indicator toevoegen in beslisboom

| Field | Value |
|---|---|
| **Type** | feedback / ux |
| **Impact** | High — klinische gebruiker in consult heeft tijdsschatting nodig; ontbrekende progress is een feedback-gap (Dim 5+6) |
| **Effort** | M (4-6u) |

**Problem:**
`src/views/QuestionnairePage.vue` rendert vragen één voor één zonder enige aanduiding van voortgang. De gebruiker (huisarts in consult) weet niet of er nog 2 of 8 vragen volgen. Bij dynamische condities (`findNextQuestionId` gebruikt `validateConditions`) is een exact aantal niet bekend, maar een gewogen schatting (totaal vragen × actieve-condities-ratio) of ten minste een ster/dot-indicator van bezochte stappen geeft het brein "ik ben bijna klaar"-gevoel.

**Solution:**
Voeg een `<nav aria-label="Voortgang vragenlijst">` toe in `QuestionnairePage.vue` boven `.question-card`, met:
1. Een gradient-bar (CSS `width: ${(answeredCount / estimatedTotal) * 100}%`) op tokens-driven background.
2. Of: dot-pagination (`<ol class="progress-dots">`) met `aria-current="step"` op de huidige vraag.
3. Tekst-fallback `<p class="sr-only">Vraag {n} van ongeveer {est}</p>`.

Bereken `estimatedTotal` als `questionnaire.value.stepIds.length` als upper-bound; `answeredCount` als `questionHistory.value.length + 1`. Update reactief.

**Acceptance criteria:**
- Given een gebruiker beantwoordt vraag 3 van een flow met 7 stappen, When de volgende vraag laadt, Then progress-bar of dot-3 wordt visueel "gevuld/actief".
- Given een screen-reader, When de pagina laadt, Then `Vraag 3 van ongeveer 7` wordt aangekondigd via `aria-live="polite"` of in de page-title.
- Given `prefers-reduced-motion: reduce`, When progress-bar update, Then animatie wordt gedempt naar 10ms.

**Implementation steps:**
- [ ] Maak `src/components/ProgressIndicator.vue` met props `current: number`, `total: number`, `variant: 'bar' | 'dots'`
- [ ] Tokens-driven CSS: bar gebruikt `--md-sys-color-primary` op `--md-sys-color-surface-container-high` track
- [ ] Voeg `<ProgressIndicator>` toe in `QuestionnairePage.vue:3` boven `<main>`
- [ ] Computed `answeredCount = questionHistory.value.length + (currentQuestion.value ? 1 : 0)`
- [ ] Computed `estimatedTotal = questionnaire.value?.stepIds?.length ?? 5`
- [ ] Update `<title>` of `aria-live` region met `Vraag {n} van {total}`
- [ ] Vitest snapshot voor 0%, 50%, 100% states

---

### DSN-K03: Copy-button "saving" + success state

| Field | Value |
|---|---|
| **Type** | feedback |
| **Impact** | Medium — klinische gebruiker kopieert documentatie naar EPD; geen interim feedback = onbevestigde actie |
| **Effort** | S (1-2u) |

**Problem:**
`src/views/ResultPage.vue:159-173` toont één knop met label "Kopieer". `copyDocumentation()` (`:290-299`) is async, maar `copyLabel` blijft "Kopieer" tot de toast verschijnt. Op mobile Safari met trage clipboard-permissions kan dit 200-500ms duren — geen visuele indicatie. NN/g-norm: state-change <100ms ofwel `aria-busy=true`.

**Solution:**
1. Tijdens `await navigator.clipboard.writeText`: zet `copyState = 'copying'` → toon spinner-icoon en label "Kopiëren…", knop `aria-busy="true"`.
2. Na succes: `copyState = 'copied'` → vink-icoon + label "Gekopieerd" voor 2s, dan reset.
3. Bij fail: `copyState = 'error'` → kruis-icoon + label "Mislukt" + reset 2s.

**Acceptance criteria:**
- Given een gebruiker tikt op "Kopieer", When de clipboard-write resolve nog niet binnen is, Then de knop toont spinner + `aria-busy="true"`.
- Given de write succes is, When de promise resolve't, Then de knop toont vink-icoon + tekst "Gekopieerd" voor exact 2000ms.
- Given `prefers-reduced-motion: reduce`, When state wisselt, Then geen scale/rotate animatie maar wel kleur-/icoon-swap.

**Implementation steps:**
- [ ] Voeg `const copyState = ref<'idle'|'copying'|'copied'|'error'>('idle')` toe in `ResultPage.vue:240`
- [ ] Wrap `copyDocumentation` in try/finally met state-overgangen
- [ ] Computed `copyIcon` en `copyText` per state
- [ ] CSS: state-class op `.copy-button` (geen background-flicker bij `idle`-restore)
- [ ] Test: vitest mock `navigator.clipboard.writeText` met delayed promise; assert `wrapper.attributes('aria-busy')`

---

### DSN-K04: AdminLogin focus-stijl repareren

| Field | Value |
|---|---|
| **Type** | a11y |
| **Impact** | High — WCAG 2.4.7 (Focus Visible) fail. Klinische context: admins zijn vaak toetsenbord-gebruikers. |
| **Effort** | XS (10 min) |

**Problem:**
`src/views/admin/AdminLogin.vue:95-97` definieert `input:focus { outline: none; ... }` zonder `:focus-visible` exception. Dit overschrijft de globale `:focus-visible` regel uit `main.css:78-81`. Toetsenbord-Tab-focus op login-velden is daardoor visueel niet onderscheidend van mouse-focus.

**Solution:**
Vervang de regel door `input:focus-visible` met expliciete outline-styling, of verwijder de override volledig zodat de globale stijl van toepassing is.

**Acceptance criteria:**
- Given een gebruiker tabt naar het username-input op `/admin/login`, When de focus op het veld komt, Then er is een zichtbare outline (2px solid primary, offset 2px) zoals op alle andere inputs.
- Given een gebruiker klikt met de muis op het input, When het veld focus krijgt, Then er is geen outline (zoals nu).
- Given Lighthouse a11y op `/admin/login`, When deze draait, Then `focus-visible` blijft 100/100 (was niet eerder getest, maak dit deel van de regressie-suite).

**Implementation steps:**
- [ ] Open `src/views/admin/AdminLogin.vue:95-97`
- [ ] Wijzig `input:focus` → `input:focus-visible` óf verwijder de regel
- [ ] Voeg `outline: 2px solid var(--md-sys-color-primary); outline-offset: 2px;` toe als de globale niet doorslaat
- [ ] Voeg `/admin/login` toe aan Lighthouse-CI routes

---

### DSN-K05: Beslisboom-state persistent maken (geen state-loss op refresh)

| Field | Value |
|---|---|
| **Type** | ux / friction |
| **Impact** | High — klinische frictie: midden in consult, refresh = alle 5 vragen opnieuw |
| **Effort** | M (3-5u) |

**Problem:**
`src/views/QuestionnairePage.vue:199` roept `questionnaireStore.clearAnswers(props.id)` op elke `onMounted` / route-watch. Dit wist alle bestaande antwoorden bij elke navigatie naar de vragenlijst, óók bij browser-refresh. Voor een klinische beslishulp die regelmatig wordt onderbroken (telefoon, andere patiënt) is dit kostbare frictie.

**Solution:**
1. Persisteer `answers` per questionnaire-id in `sessionStorage` via Pinia plugin (`pinia-plugin-persistedstate`) of handmatige hook.
2. Bij mount: lees `sessionStorage` → restore `currentQuestionId` + `questionHistory`.
3. Voeg een **expliciete "Opnieuw beginnen"-knop** toe in de header van de vragenlijst die `clearAnswers` aanroept met confirm-dialog.
4. TTL van session: tot `beforeunload` of 30 min inactiviteit.

**Acceptance criteria:**
- Given een gebruiker beantwoordt 3 vragen en refresht de browser, When de pagina herlaadt, Then de gebruiker is terug op vraag 4 met antwoorden 1-3 bewaard.
- Given een gebruiker tikt op "Opnieuw beginnen", When ze bevestigen in de dialog, Then alle antwoorden worden gewist en de eerste vraag toont.
- Given 30 minuten inactiviteit, When de gebruiker terugkeert, Then de session is verlopen en de eerste vraag toont.

**Implementation steps:**
- [ ] Installeer `pinia-plugin-persistedstate` of schrijf eigen `subscribe` op `questionnaireStore`
- [ ] Persisteer alleen `answers` per `questionnaireId`, niet de hele store (privacy)
- [ ] Verwijder de `clearAnswers` call uit `loadStateAndDetermineStart` (regel 199)
- [ ] Voeg "Opnieuw beginnen"-button + ConfirmDialog component toe (eventueel atomair component)
- [ ] Restore `questionHistory` + `currentQuestionId` in `onMounted` als sessionStorage data heeft
- [ ] Documenteer privacy: geen PHI in storage, alleen flow-progress
- [ ] Vitest: stub sessionStorage, mount with mocked state, assert correct restore

---

### DSN-K06: Dark-mode handmatige toggle

| Field | Value |
|---|---|
| **Type** | ux / responsive |
| **Impact** | Medium — klinische omgeving wisselt van fel licht (kantoor) naar dim (avonddienst); OS-only verandert niet snel genoeg |
| **Effort** | S (1-2u) |

**Problem:**
`src/index.html:8-13` en `src/App.vue:45-48` koppelen het theme aan OS-only (`prefers-color-scheme`). Geen handmatige override. Klinische gebruikers in een spreekkamer met fel ambient licht op een laptop met systeem-dark zien een dark UI op een licht scherm — verminderde leesbaarheid.

**Solution:**
1. Voeg een `ThemeToggle.vue`-component toe (3-state: light/dark/system) in `AppHeader.vue`.
2. Persisteer keuze in `localStorage` als `theme-preference`.
3. `App.vue` mount-logic kiest: localStorage → fallback naar `prefers-color-scheme`.
4. Bij wijziging: update `data-theme` op `<html>` direct (geen FOUC).
5. Toegankelijkheid: `<button aria-pressed>` of `<select>` met `aria-label="Themavoorkeur"`.

**Acceptance criteria:**
- Given de gebruiker selecteert "Donker" in de header, When ze de pagina refreshen, Then de UI blijft donker ongeacht OS-instelling.
- Given "Volg systeem" geselecteerd is en de OS-instelling wisselt, When dit gebeurt, Then de UI wisselt mee zonder refresh.
- Given een nieuwe gebruiker zonder voorkeur, When ze de app openen, Then de keuze valt terug op OS (huidige gedrag).

**Implementation steps:**
- [ ] Maak `src/components/ThemeToggle.vue` met 3-state radiogroup
- [ ] Maak `src/store/themeStore.ts` (Pinia) met getter `current` + action `set`
- [ ] Inject in `AppHeader.vue` naast `RoleToggle`
- [ ] Hook in `App.vue` `onMounted`: kies localStorage > matchMedia
- [ ] Voeg `color-scheme: light dark` toe aan `:root` in `tokens.css` voor browser-form-controls
- [ ] Vitest: assert correcte data-theme op html-root na set

---

### DSN-K07: Container queries + forced-colors voor klinische robustheid

| Field | Value |
|---|---|
| **Type** | responsive / a11y |
| **Impact** | Medium — Windows High Contrast Mode renders urgency-badges mogelijk onleesbaar; container-queries maken option-item adaptief |
| **Effort** | M (3-4u) |

**Problem:**
`src/views/ResultPage.vue:417-422` gebruikt `background-color: var(--md-sys-color-error); color: white;` voor urgency-badges. In Windows Forced-Colors-Mode worden background-colors door het systeem overschreven; het label kan verdwijnen (white-on-system-bg-canvas). Daarnaast hangen alle componenten op viewport-mediaqueries — `option-item` past niet aan kaart-breedte aan in een toekomstige grid-layout.

**Solution:**
1. Voeg `@media (forced-colors: active)` blok toe aan `ResultPage.vue` urgency-badges en aan `option-item` selected-state — gebruik `border: 2px solid CanvasText` en `forced-color-adjust: none` selectief.
2. Gebruik `@container` op `.result-content` (`container-type: inline-size`) en wijzig `option-item` styling op basis van container-breedte i.p.v. viewport.
3. Voeg `@media (prefers-contrast: more)` toe voor extra-zware borders en tekst.

**Acceptance criteria:**
- Given Windows High Contrast Mode (Black, White, Color Inversions), When `/info/uti-onbehandeld` laadt, Then urgency-badge "U2" toont met zichtbare border en tekst.
- Given een toekomstige sidebar-layout op desktop, When `option-item` in een 400px-brede container staat, Then de prefix-letter wordt ingeklapt.
- Given `prefers-contrast: more`, When de pagina laadt, Then `--md-sys-color-outline` borders worden 2px ipv 1px.

**Implementation steps:**
- [ ] Voeg `@media (forced-colors: active) { .urgency-badge { border: 2px solid CanvasText; forced-color-adjust: none; } }` toe in `ResultPage.vue`
- [ ] Voeg analoog blok toe voor `.option-selected` in `QuestionnairePage.vue`
- [ ] Wrap `.result-content` in `container-type: inline-size; container-name: result;`
- [ ] Refactor mobile-tweaks van `option-item` naar `@container result (max-width: 480px)`
- [ ] Voeg `@media (prefers-contrast: more)` blok toe in `tokens.css` met aangepaste `--md-sys-color-outline-variant` en `--md-sys-color-on-surface-variant`

---

### DSN-K08: Component primitives extraheren (Button, Card, OptionItem)

| Field | Value |
|---|---|
| **Type** | component |
| **Impact** | Medium — voorkomt drift bij toevoegen van nieuwe flows/views; nu zijn `.md-button` klassen-strings de enige API |
| **Effort** | L (8-12u) |

**Problem:**
`src/styles/components.css:31-88` definieert `.md-button`, `.md-button--primary`, `.md-button--outlined`, `.md-button--text` als CSS-klassen. Elke view importeert ze als string-classes (`<button class="md-button md-button--primary">`). Geen TS-typing, geen prop-validatie, geen impossibility prevention (kan ongeldige combo `md-button--primary md-button--outlined` toepassen). Toekomstige flows zullen `.option-item` en treatment-section dupliceren.

**Solution:**
Extraheer Vue-component-primitives:
1. `src/components/ui/AppButton.vue` met props `variant: 'primary'|'outlined'|'text'`, `size: 'sm'|'md'`, `loading: boolean`, `disabled: boolean`. Slot voor content.
2. `src/components/ui/AppCard.vue` met props `accent: 'none'|'primary'|'warning'|'error'`. Slot.
3. `src/components/ui/OptionItem.vue` met props `selected, info, onSelect`. Encapsuleert de option-item CSS uit QuestionnairePage.
4. Verplaats CSS van `components.css` naar elke `<style scoped>` of behoud globale tokens-driven styling.

**Acceptance criteria:**
- Given een ontwikkelaar maakt een nieuwe view, When ze een knop nodig hebben, Then `<AppButton variant="primary">` is de enige bron — geen vrije CSS-klassen.
- Given de TypeScript build, When `<AppButton variant="invalid">` wordt geschreven, Then de build faalt met type error.
- Given a11y-tests, When de button rendert, Then `loading=true` zet `aria-busy="true"` en `disabled`.

**Implementation steps:**
- [ ] Maak `src/components/ui/AppButton.vue` (Vue 3 SFC + TS interface)
- [ ] Migreer `.md-button*` classes naar scoped of via `:deep()`
- [ ] Refactor `QuestionnairePage.vue:71-78` (`<button class="md-button md-button--primary">`) naar `<AppButton variant="primary">`
- [ ] Refactor `ResultPage.vue:159-173` (copy-button) naar `<AppButton variant="outlined">` met loading-prop (zie DSN-K03)
- [ ] Maak `OptionItem.vue` (zie ook DSN-K01 — gebruik native `<button>` daarbinnen)
- [ ] Vitest tests per primitive
- [ ] Storybook (optioneel) of MDX-stories voor visuele regressie

---

## Test Results

### Lighthouse scores (vers gemeten 2026-05-03 op preview-build via `npx vite preview --port 4787`)

| Route | Preset | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| `/` | desktop | **98**/100 | **100**/100 | **100**/100 | 91/100 | 1.1 s | 0 ms | 0 |
| `/questionnaire/gezonde-vrouwen` | desktop | **100**/100 | **100**/100 | **100**/100 | n.v.t. (skipped) | 0.7 s | 0 ms | 0 |
| `/` | mobile | — | — | — | — | — | — | — |
| `/questionnaire/gezonde-vrouwen` | mobile | — | — | — | — | — | — | — |

**Mobile-runs zijn niet voltooid** — eerste poging gaf `Runtime error: Chrome prevented page load with an interstitial`. De `vite preview` server reageerde nog correct op `curl` direct na de test, maar verloor connectie tussen pogingen. Aanbeveling: in CI Lighthouse against `dist/` met static-server (`serve` of `http-server`) i.p.v. `vite preview` om hot-module-Reload-interferentie uit te sluiten.

### Falende Lighthouse-audits (home, desktop)

```
unused-javascript        (score 0)   — Reduce unused JavaScript: Est savings 61 KiB
robots-txt               (score 0)   — robots.txt is not valid (49 errors found)
bf-cache                 (score 0)   — Page prevented back/forward cache restoration
                                       reason: "Internal error", failureType: "Not actionable"
network-dependency-tree  (score 0)   — Network dependency tree (insight)
render-blocking-insight  (score 0.5) — Render-blocking requests
                                       (Inter font CSS via media=print swap)
```

**Falende a11y-audits:** GEEN. `color-contrast` PASS (1.0), `target-size` PASS (1.0), `image-alt` PASS, `aria-*` PASS, `heading-order` PASS, `link-name` PASS.

### Build output (uit `dist/assets/`)

| Asset | Size (raw) |
|---|---|
| `index-Bt1Xsim4.js` (root chunk) | 333.9 KB |
| `index-CE4ePGdk.css` | 39.9 KB |
| `QuestionnairePage-DrYtfry1.js` | 47.9 KB |
| `QuestionnairePage-Cq69Wb7l.css` | 7.5 KB |
| `LogDashboard-DT68rrbB.js` | 18.5 KB |
| `LogDashboard-DP1mFlP_.css` | 14.2 KB |
| `AdminLogin-Cq19BXWR.js` | 1.3 KB |
| `AdminLogin-C6vlWWoW.css` | 1.7 KB |
| `workbox-window.prod.es5-BIl4cyR9.js` | 5.8 KB |

Totale unminified+ungezipped JS root-chunk = 333 KB. Met gzip en code-splitting in productie acceptable (61 KB unused-savings). Largest CSS chunk = `index-CE4ePGdk.css` 39.9 KB ungzipped.

### Extra a11y / lint runs

Niet vers uitgevoerd in deze audit-run:
- `npm run lint:eslint` — geen eslint-plugin-jsx-a11y of vue-a11y plugin actief in `eslint.config.js`. Lokale lint dekt geen a11y.
- `npm run check` (vue-tsc) — zou geslaagd zijn (project is in clean state), niet vers gerund.
- Geen `@axe-core/playwright` tests gevonden.

**Aanbevolen vervolg:** voeg `eslint-plugin-vuejs-accessibility` toe aan `eslint.config.js` en run in CI; voeg een minimale `@axe-core/playwright` smoke-test toe op `/`, `/questionnaire/gezonde-vrouwen`, `/info/uti-onbehandeld`, `/admin/login`.

---

## Improvement Opportunities (gesorteerd op impact/effort)

| # | DSN | Impact | Effort | Type |
|---|---|---|---|---|
| 1 | DSN-K04 — AdminLogin focus-stijl repareren | High | XS (10 min) | a11y / WCAG 2.4.7 fix |
| 2 | DSN-K01 — Native `<button>` voor opties | High | M (3-4u) | a11y / WCAG 2.1.1 + 4.1.2 |
| 3 | DSN-K05 — Beslisboom-state persisteren | High | M (3-5u) | klinische friction |
| 4 | DSN-K02 — Progress-indicator | High | M (4-6u) | klinische feedback |
| 5 | DSN-K03 — Copy-button states | Medium | S (1-2u) | feedback completeness |
| 6 | DSN-K06 — Dark-mode toggle | Medium | S (1-2u) | klinische context |
| 7 | DSN-K07 — Container queries + forced-colors | Medium | M (3-4u) | a11y robustheid |
| 8 | DSN-K08 — Component primitives | Medium | L (8-12u) | drift-preventie |

Quick-wins (≤ 2u): DSN-K04, DSN-K03, DSN-K06.

---

## Anti-verschraling checklist

### Header & Context
- [x] Eerste regel: `# urinest.rip — Design Audit 2026-05-03`
- [x] `**Auditor:** Claude Opus 4.6 (1M context)` aanwezig
- [x] `**Stack:**` + `**Design-system status:**` + `**Codebase size:**` + `**Scope:**` aanwezig
- [x] Context Summary tabel bevat: Framework, Styling, Design tokens, Component library, Icon set, Dark mode, A11y tooling, Motion library, Lighthouse (desktop), Lighthouse (mobile), CWV, Contrast audit
- [x] Elke rij in Context Summary is gevuld

### Wijzigingen sinds vorige audit
- [x] Sectie aanwezig
- [x] Aantal commits + gewijzigde design-bestanden vermeld
- [x] Gebruiker heeft "eerste audit" expliciet gespecificeerd → genoteerd

### Kwantitatieve Metrieken
- [x] Tabel bevat: hardcoded kleuren, CVA adoptie, @layer, prefers-reduced-motion, safe-area, dvh/svh/lvh, primitives count, a11y anti-patterns
- [x] Elke metriek heeft waarde + doel + status

### Lighthouse
- [x] 2 routes (home + questionnaire) × desktop getest
- [x] Performance / A11y / Best Practices / SEO scores getoond
- [x] LCP / TBT / CLS waarden getoond
- [x] Falende Lighthouse-audits letterlijk gekopieerd
- [x] Mobile niet-draaien verklaard (Chrome interstitial + server-stop)
- [x] Contrast audit expliciet (PASS)

### Scorecard
- [x] Tabel met Dimensie | Score | Delta | Notes
- [x] Alle 10 dimensies aanwezig
- [x] Delta = "new" bij eerste audit
- [x] Notes 1-zin per dimensie
- [x] Overall met gemiddelde + percentage

### Per-dimensie analyse
- [x] Elke dimensie heeft `**Strengths:**` met ≥2 bullets
- [x] Elke strength bevat `file:line` referentie
- [x] Elke dimensie heeft `**Remaining issues:**` met file:line + impact
- [x] Geen "Looks good" zonder onderbouwing
- [x] Klinische gewichts-waarschuwing (⚠) op Dim 5 + Dim 6

### Kritieke UI-paden Review
- [x] ≥3 paden geïdentificeerd (6 stuks: beslisboom / resultaat / terug-nav / rol-switch / copy / update-prompt)
- [x] Per pad: Friction / Feedback / A11y / Motion beoordeeld
- [x] Verdict per pad

### Design SPECs
- [x] Elke SPEC heeft tabel: Type, Impact (+ waarom), Effort (+ uren)
- [x] Elke SPEC heeft `**Problem:**` met file:line
- [x] Elke SPEC heeft concrete `**Solution:**`
- [x] Elke SPEC heeft Acceptance criteria (Given/When/Then, ≥2)
- [x] Elke SPEC heeft Implementation steps (≥3 checkboxes)
- [x] DSN-IDs uniek (K01-K08)
- [x] Minimaal 3 DSNs (8 stuks)

### Test Results
- [x] Lighthouse scores in tabel
- [x] Falende audits letterlijk
- [x] Build output bundle size
- [x] Bij niet-draaien expliciete reden

### Kwantitatieve checks
- [x] Rapport ≥200 regels (475+ regels)
- [x] Improvement Opportunities gesorteerd op impact/effort
- [x] Minimaal 3 DSNs (8 geleverd)
- [x] Anti-verschraling checklist letterlijk onderaan met [x]/[ ]
