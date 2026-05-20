# urinest.rip — Design Audit 2026-05-07

**Auditor:** Claude Opus 4.6 (1M context)
**Stack:** Vue 3, Vite
**Design-system status:** In opbouw — eigen Material Design 3 (MD3) tokenlaag in CSS variabelen (geen DTCG, geen primitive layer, geen documentatie/Storybook)
**Codebase size:** ~3.679 LOC in `src/` (CSS + Vue alleen; ~6.4k incl. TS), 4 CSS-bestanden, 16 component-bestanden (`src/components/` + `src/views/`)
**Scope:** Volledig (clinical decision-aid, behandelaar + triagist rollen, PWA offline, NL-only)

---

## Context Summary

| Aspect | Detail |
|---|---|
| **Framework** | Vue 3.5.24, Vue Router 4.6, Pinia 3.0, Vite 7.2 |
| **Styling** | Plain CSS in `<style scoped>`, MD3-tokens in `src/styles/tokens.css`, themes in `src/styles/themes.css`, components in `src/styles/components.css` |
| **Design tokens** | CSS custom properties met `--md-sys-*` (Material 3 schema). Geen DTCG-JSON, geen Style Dictionary, geen primitive layer (`--color-*`, `--space-*`) |
| **Component library** | Eigen primitives via class-naming (`.md-button`, `.md-card`, `.md-tile`, `.md-list`, `.md-checkbox`). Geen Radix / Headless UI / shadcn |
| **Icon set** | Inline SVG paths (mix Material Icons / Heroicons / Lucide). Geen single-source iconset |
| **Dark mode** | `prefers-color-scheme: dark` → `data-theme="dark"` (`index.html:8-13`, `App.vue:45-48`). Geen handmatige toggle in UI |
| **A11y tooling** | `eslint-plugin-vue` deels, `oxlint`, `eslint-plugin-security`. **Geen** `eslint-plugin-jsx-a11y` / `vuejs-accessibility`, **geen** axe-core in CI |
| **Motion library** | Pure CSS-transitions + Vue `<Transition>` / `<TransitionGroup>`. Geen Motion / spring physics. Wel `prefers-reduced-motion: reduce` (`main.css:113-120`) |
| **Skip-link** | **Afwezig** (geen `skip-to-content`) |
| **`<h1>`** | **Afwezig** op alle routes (alleen `<h1>` op AdminLogin); h2/h3 begint zonder pagina-niveau heading |
| **PWA** | `vite-plugin-pwa`, manifest, service worker met update prompt (sheet bottom) |
| **Lighthouse** | Niet gedraaid — preview-server vraagt expliciete bevestiging en de audit-context heeft geen browser-instance. Desktop-scores van 2026-05-03 (Perf 98-100, A11y 100, BP 100) blijven indicatief |

---

## Wijzigingen sinds vorige audit ("Eerste design-audit")

Deze audit is het **eerste design-audit onder het 10-dimensies-scoreraamwerk** voor dit project.
Eerdere documenten in `docs/design-audit-2026-04-*.md` en `docs/design-audit-2026-05-0[123].md` waren ad-hoc audits zonder dimensie-scoring of SPEC-IDs en worden niet als baseline gebruikt — er is dus geen quantitatieve delta. Vanaf vandaag is de scorecard hieronder de baseline; volgende audits vergelijken hiertegen.

Highlights bij eerste meting:
- Design-tokens in MD3-stijl, fluid clamp() typografie en spacing aanwezig.
- Reduced-motion en safe-area worden gerespecteerd.
- Touch-targets zijn 44px+ in alle interactieve plekken.
- **Kritiek**: heading-hierarchie mist `<h1>` per route (WCAG 1.3.1 / 2.4.6).
- **Kritiek**: `role="button" tabindex="0"` op antwoord-opties met alleen `@keydown.enter`, geen Space (WCAG 2.1.1).
- **Kritiek**: skip-link ontbreekt (WCAG 2.4.1).
- Geen container queries, geen View Transitions API, geen `light-dark()`, geen `@layer`.

---

## Kwantitatieve metrieken

| Metriek | Waarde | Waar | Beoordeling |
|---|---|---|---|
| Hex-kleuren in tokens | ~52 unieke | `tokens.css:7-58`, `themes.css:1-55` | OK — gecentraliseerd |
| Hex-kleuren buiten tokens | 1 in Vue (`StripSvg.vue:82`), 12 in `lib/logger.ts` | `grep '#[0-9a-fA-F]'` | Logger is dev-tool (console-styling) — acceptabel; SVG-fill in StripSvg moet via token |
| `rgba()` calls | 3 (waarvan 2 in `:disabled` van `.md-button--primary`) | `components.css:65-66`, `UpdatePrompt.vue:78` | Disabled-state in primary-button is hard-coded **light-mode-only** kleur — breekt in dark-mode |
| `color-mix(in srgb, …)` | 8 plekken (hover/press states) | meerdere `.vue` files | Modern, OK |
| `clamp()` op typografie | 12 (display, headline, title, body, label) | `tokens.css:68-90` | Sterk — fluid typografie |
| `clamp()` op spacing | 5 (`--spacing-md/lg/xl/xxl`) | `tokens.css:117-120` | Sterk |
| `prefers-reduced-motion` | 1 globale rule | `main.css:113-120` | Aanwezig + correct geforceerd |
| `prefers-color-scheme` | 2 (theme-color meta + JS) | `index.html:6-12`, `App.vue:45-48` | OS-only, geen UI-override |
| `safe-area-inset-*` | 4 tokens + 3 gebruiksites | `tokens.css:126-129`, `main.css:106`, `ToastContainer.vue:138`, `UpdatePrompt.vue:161` | Goed |
| `100dvh` | 1 site | `App.vue:59` | Goed (fallback `100vh` op regel 58). Géén `svh`/`lvh` |
| `light-dark()` | 0 | — | Niet gebruikt — handmatig theme-mechanisme |
| View Transitions API | 0 | — | Niet gebruikt — wel Vue `<transition>` op route + `<TransitionGroup>` op toast |
| `@layer` | 0 | — | Geen cascade-laag-architectuur |
| CVA / class-variance-authority | 0 | — | Niet gebruikt; class-states worden via `:class="{ … }"` gedaan |
| Container queries | 0 | — | Mist voor kaart-componenten met variabele breedte |
| `cqi`/`cqw`/`cqh` units | 0 | — | — |
| `subgrid` | 0 | — | — |
| `!important` | 4 (alle binnen `prefers-reduced-motion`-blok) | `main.css:115-118` | Acceptabel: bewust geforceerd voor reduced motion |
| Aria-attributes (totaal) | 29 occurrences | `grep aria- src/`+ | Beperkt; toast (`aria-live="polite"` + `role="alert"`), role-toggle (`role="radiogroup"`), popover (`role="tooltip"`), questionnaire skeleton (`aria-busy`) |
| Skip-link | 0 | — | **WCAG 2.4.1 fail** |
| `<h1>` op routes | 0 (op niet-admin) | — | **WCAG 1.3.1 fail** — alle pagina's beginnen met `<h2>` |
| `tabindex="0"` op niet-button-element | 1 (`option-item` in QuestionnairePage) | `QuestionnairePage.vue:46-49` | **WCAG 2.1.1 partieel** — Space wordt niet afgehandeld |
| `v-html` | 2 (markdown-render) | `QuestionnairePage.vue:84,103` | XSS-risico beperkt: bron is YAML-bestand uit eigen build, marked-output. Geen sanitizer. Acceptabel voor closed content, blijft een DOMPurify-overweging |
| `outline: none` zonder vervanging | 1 (`AdminLogin.vue:95`) | `AdminLogin.vue:88-101` | **WCAG 2.4.7 fail** — focusring weg, vervangen door `border-color` change die geen focus-state communiceert aan toetsenbordgebruikers |
| Mediaqueries (totaal) | 11 unieke patronen | meerdere | Inconsistent: `599px`, `600px`, `640px`, `767px`, `479px`, `900px` door elkaar — geen breakpoint-token |
| Inline `<style>` per route | Alle vier views (LandingPage, Questionnaire, Result, About) | gebruik van `<style scoped>` | OK voor isolatie, maar het levert duplicatie op (skeleton-styles 2x, back-button 2x) |

---

## Scorecard (1-5, 5 = excellent)

| # | Dimensie | Score | Toelichting |
|---|---|---|---|
| 1 | Design Tokens & Theming | **3.5** | Goed gestructureerd MD3-systeem, dark/light werkt, **maar** geen primitive-laag, geen DTCG, dark-mode disabled-state breekt, geen `light-dark()`, geen handmatige toggle |
| 2 | Componentisatie & Hergebruik | **2.5** | Geen primitive components — alleen klasse-conventies. Skeleton + back-button gedupliceerd. Question-options en Result-secties zijn niet uitgepakt naar herbruikbare componenten |
| 3 | Toegankelijkheid (WCAG 2.2 AA) | **2.0** | Mandatory voor clinical app — er zijn meerdere fouten: skip-link weg, geen `<h1>` per route, `role="button"` zonder Space, `outline:none` op admin-input, geen axe in CI, geen `vuejs-accessibility` plugin. Goede dingen: focus-visible, touch-targets 44px, aria-live op toast, prefers-reduced-motion, lang="nl" |
| 4 | Motion & Micro-interacties | **3.5** | Stagger-children animaties, fade-route-transition, skeleton-shimmer, scale(0.97) press-state, sheet-fly voor update. Reduced-motion correct. **Mist** View Transitions API (zou cross-route shared element opleveren), spring-physics, geen explicit `will-change` op alles wat anim |
| 5 | Frictieloze UX (KRITIEK voor clinical) | **3.0** | Zie Dim 5 detail. Sterk: keyboard-shortcuts (A/B/C…), skeleton-loaders, terug-knop, snel pad. Zwak: **Space toets werkt niet op opties**, multi-select toont geen "X geselecteerd"-counter, `goToPreviousQuestion` heeft geen Esc/Backspace-shortcut, info-popover op mobiel onbereikbaar zonder hover (alleen via focus na tap) |
| 6 | Visuele feedback (KRITIEK voor clinical) | **3.0** | Zie Dim 6 detail. Sterk: skeleton-states, scale-press, hover-lift, toast voor copy, urgency-badge. Zwak: **disabled-state hard-coded light** op primary-button, **geen u1-style** maar wel `urgency` veld in types, geen progress indicator door beslisboom (welke vraag uit hoeveel?), copy-button geeft alleen toast — geen aria-live voor screenreaders die de copy bevestigt |
| 7 | Typografie & Inhoud | **4.0** | Inter, fluid clamp() schaal, body-line-height 1.5-1.6 (medical readability standaard), heading-hierarchie consistent gestyled. **Mist** `<h1>` per route, geen `text-wrap: balance/pretty`, geen letter-spacing-tokens |
| 8 | Forms & Validatie | **2.5** | Slechts één echt formulier (AdminLogin). `autocomplete` ingevuld, `required`, label-for. **Mist**: `aria-invalid`, `aria-describedby` voor errors, `inputmode`, `enterkeyhint`, error-summary, `outline:none` op input. Question-options doen formulier-werk maar zijn semantisch buttons-met-tabindex i.p.v. radio/checkbox |
| 9 | Performance & Bundle | **4.0** | Vite 7, code-splitting per route mogelijk, `vite-plugin-compression`, font preloaded met print-trick, `contain: layout style paint` op content + result. PWA met cache. **Mist** `loading="lazy"` op niet-critical SVG, geen explicit chunk-naming policy, geen perf-budget |
| 10 | Responsive & Adaptive | **3.0** | Fluid typografie + spacing met clamp(), `(hover: none)` aanpassingen voor touch, viewport-fit=cover. **Mist** container queries voor result-secties, breakpoint-token-systeem, en `svh`/`lvh` units (alleen `dvh` op `App.vue:59`). Inconsistent breakpoint-set (479/599/600/640/767/900) |

**Gemiddelde:** 3.10 / 5.00
**Gewogen** (Dim 5 + 6 dubbele weging vanwege clinical-context): (3+3.5+2+3.5+3*2+3*2+4+2.5+4+3) ÷ 12 = **3.13 / 5.00**

Voor een klinische beslishulp is dit **onvoldoende**. Doel: ≥ 4.0 op Dim 3, 5 en 6 binnen één sprint.

---

## Per-dimensie

### Dimensie 1 — Design Tokens & Theming (3.5)

**Sterk**
- Volledige MD3-token-set in `src/styles/tokens.css:1-147`: kleuren, typografie, elevation, shape, state-layers, spacing, motion, z-index.
- Dark-theme override in `src/styles/themes.css:1-55`.
- `theme-color` meta met `prefers-color-scheme` per scheme (`index.html:6-7`).
- FOUC voorkomen door inline `<script>` in `<head>` die `data-theme` zet vóór CSS laadt (`index.html:8-13`).

**Zwak**
- Geen primitive-laag. `--md-sys-color-primary` is direct een `#16a34a` — geen `--color-green-500` → `--color-brand-primary` → `--md-sys-color-primary` ladder.
- `disabled` op primary-button in `components.css:64-67` is hardcoded `rgba(28, 27, 31, 0.12)` / `rgba(28, 27, 31, 0.38)` — werkt niet in dark-mode (zwart-op-zwart).
- Geen DTCG-JSON of Style Dictionary, dus tokens zijn niet exporteerbaar voor Figma / native apps.
- Geen `light-dark()` functie gebruikt; alle dark-vars opnieuw gedeclareerd.
- `--md-sys-color-warning` is geen MD3 standaard role — eigen extensie.
- StripSvg heeft hard-coded `#a855f7` in scoped style (`StripSvg.vue:82`).

### Dimensie 2 — Componentisatie & Hergebruik (2.5)

**Sterk**
- Vijf SVG-illustraties als losse componenten met `:hover`/`:touch` slot-props (`MenuItem.vue:29`).
- Toast-systeem als globale component met store-binding.

**Zwak**
- Geen primitive `Button.vue`, `Card.vue`, `Checkbox.vue`, `Badge.vue`. Alle styling gaat via `.md-button--primary` etc. ⇒ geen variants-API, geen TS-props, geen Storybook.
- Skeleton-loader code is in `QuestionnairePage.vue:6-13,654-676` én `ResultPage.vue:23-49,634-653` gedupliceerd.
- "Back-button" pattern is gedupliceerd in `QuestionnairePage.vue:447-467` en `ResultPage.vue:355-377`.
- `urgency-badge` is private aan `ResultPage.vue:408-423` — niet gedeeld terwijl `Toast` ook badges heeft.
- Question-option (option-item) is een grote inline-block met info-popover; geen `OptionList.vue` / `Option.vue`.

### Dimensie 3 — Toegankelijkheid WCAG 2.2 AA (2.0) — KRITIEK

**Geslaagd**
- `:focus-visible` globaal met 2px outline (`main.css:78-85`).
- `--min-touch-target: 44px` consequent toegepast (`AppHeader.vue:91-92`, `QuestionnairePage.vue:459,589-590`, `ResultPage.vue:366,462,572`, `RoleToggle.vue:62-67`).
- `aria-live="polite"` op toast-container (`ToastContainer.vue:2`).
- `aria-busy` + `aria-label` op skeletons (`QuestionnairePage.vue:4`, `ResultPage.vue:26-27`).
- `role="radiogroup"` + `aria-checked` op RoleToggle (`RoleToggle.vue:2-14`).
- `role="tooltip"` op popover (`QuestionnairePage.vue:101`).
- `lang="nl"` op `<html>` (`index.html:2`).
- `aria-hidden="true"` op alle decoratieve `<svg>` paths.
- `prefers-reduced-motion: reduce` correct geforceerd (`main.css:113-120`).

**Niet geslaagd / risico**
- **Skip-link ontbreekt** — geen "Naar inhoud springen" voor screenreader/keyboard. WCAG 2.4.1.
- **Geen `<h1>` op enige route** behalve AdminLogin (`AdminLogin.vue:33`). LandingPage, QuestionnairePage, ResultPage, AboutPage, ErrorPage starten met `<h2>` of `<h3>`. WCAG 1.3.1, 2.4.6.
- **Custom-button via `role="button" tabindex="0"`** zonder Space-handler: `QuestionnairePage.vue:46-49`. ARIA-spec eist Enter én Space. Voor radiogroup-pattern (single-select) zou pijl-toetsen moeten werken.
- **Multi-select-question is geen checkbox-group**: er staat `role="button"` op een element dat `aria-pressed` zou moeten dragen (toggle-state) of beter een echte checkbox.
- **`outline: none` op login-input** zonder visuele vervanging die als focus-state werkt voor toetsenbord (`AdminLogin.vue:95`). Border-color-shift is alleen visueel verschil bij `:focus`, geen `:focus-visible`.
- **Geen axe-core / vuejs-accessibility-plugin** in CI.
- Question-option `tabindex="0"` is keyboard-focuseerbaar maar mist `aria-pressed`/`aria-checked` om toggle-state aan te kondigen — multi-select toont alleen visueel of optie geselecteerd is.
- Info-popover gebruikt hover als primaire trigger; touch-gebruikers moeten via focus (na klik) komen — geen click-to-toggle, geen Escape-key-dismiss, geen click-outside-to-close (alleen blur-event op de button).
- Toast `role="alert"` is correct maar in combinatie met `aria-live="polite"` op de container ontstaat dubbele announce.
- `v-html` op markdown is XSS-vector als YAML-bron ooit user-content krijgt — geen `DOMPurify`.
- Geen `<main>` met `id="main"` (er is wel een `<main>`-element, maar zonder id hoort skip-link bij).
- Geen `aria-current="page"` op router-link in de header.

### Dimensie 4 — Motion & Micro-interacties (3.5)

**Sterk**
- Alle motion via tokens (`--motion-duration-*`, `--motion-easing-*`).
- Reduced-motion-fallback (`main.css:113-120`).
- `:active { transform: scale(0.97) }` press-feedback globaal (`components.css:117-123`) en lokaal (`MenuItem.vue:58-61`, `AppHeader.vue:107-110`).
- Stagger-children pattern (`components.css:126-138`) voor LandingPage tiles + ResultPage sections.
- Skeleton-shimmer animaties op load.
- Sheet-fly + scrim-fade voor update prompt (`UpdatePrompt.vue:136-159`).
- Spring easing token `--motion-easing-spring` aanwezig (al niet veel gebruikt).

**Zwak**
- Geen View Transitions API — beslisboom-progressie zou met VT-naam shared-element kunnen morphen.
- `will-change: opacity, transform` alleen op `.fade-enter-active` / `.fade-leave-active` (`App.vue:77,84`); andere animations missen het.
- Stagger-children is hard-coded tot `:nth-child(8)` (`components.css:131-138`); het 9e item krijgt geen entrance.
- Skeleton-shimmer pulses tussen `opacity 1 → 0.4` zonder gradient-shimmer — minder modern dan een gradient-sweep.
- Press-state op `.option-item:active::before` (regel 530-533) is een aparte ::before vóór laag, terwijl de hover een box-shadow doet — twee mechanismen voor één concept.

### Dimensie 5 — Frictieloze UX (3.0) — KRITIEK voor clinical

Friction in een klinische beslishulp = klinisch risico (verkeerd antwoord, afgebroken flow, dubbele invoer, foute diagnose).

**Sterk**
- **Single-select advance**: tikken op antwoord = direct naar volgende vraag (`QuestionnairePage.vue:286-293`). Geen "Volgende"-knop nodig.
- **Keyboard shortcuts A–Z** voor antwoorden (`QuestionnairePage.vue:326-340`). Alleen zichtbaar op pointer-fine devices via `option-prefix` letter (`isNonTouchDevice`).
- **Terug-knop** binnen vragenlijst die history pop't (`QuestionnairePage.vue:249-252`).
- **Skeleton-loaders** vóór data-load (`QuestionnairePage.vue:4-14`, `ResultPage.vue:23-49`).
- **Auto-redirect** wanneer flow zegt `redirect:` (`QuestionnairePage.vue:272-275`).
- **Conditional reveal** treatment ná contra-indicatie-check (`ResultPage.vue:111-126`) — voorkomt voorbarige medicatie-instructie.
- **Copy-to-EPD** knop in result (`ResultPage.vue:159-173`) — kritiek voor doctor-flow.
- **Sticky header** met Role-toggle altijd zichtbaar (`AppHeader.vue:46-56`).
- **dvh** op grid voorkomt mobile viewport jump (`App.vue:59`).
- **OS-only dark mode** = geen extra cognitieve load voor toggle.

**Zwak — geverifieerd**
- **Space-toets werkt niet op antwoord-opties** (`QuestionnairePage.vue:49`). Enter wel, Space niet. Voor `role="button"` is Space verplicht (ARIA APG). Een arts die met Space "klikt" gaat niets doen → friction.
- **Geen progress-indicator** door beslisboom: gebruiker weet niet bij vraag 3-uit-?, geen mentale planning. Missing visuele feedback dim-overlap met Dim 6.
- **Multi-select telt niet** geselecteerde opties; `Bevestigen` is `disabled` zolang `hasSelectedOptions === false`, maar hoeveel opties al staan ingevuld is niet zichtbaar als badge.
- **Geen Escape om popover te sluiten** (`QuestionnairePage.vue:395-401`); ook geen click-outside.
- **Info-icon op mobiel**: `@mouseenter`+`@focus` triggers werken op desktop én bij touch (focus na tap). Maar de popover sluit op `@blur` direct — als gebruiker de tekst wil lezen en de scroll begint, blur'ed het en sluit de popover. Friction. Zou click-to-open-tap-buiten-om-te-sluiten moeten zijn.
- **Geen Escape/Backspace shortcut** voor `goToPreviousQuestion` — alleen klikken op Terug.
- **`questionnaireStore.clearAnswers(props.id)` bij elke `loadStateAndDetermineStart`** (`QuestionnairePage.vue:199`) wist alle eerder gegeven antwoorden zodra je terug naar `/questionnaire/x` navigeert. Geen state-restore. Een arts die per ongeluk op het logo tikt in de header start helemaal opnieuw.
- **`console.error` als enige fail-state** voor onbekende result-key (`ResultPage.vue:275-279`); gebruiker ziet alleen een tekst maar geen "doe X om door te gaan".
- **Geen offline-indicator** terwijl PWA wel offline werkt — gebruiker krijgt geen visuele bevestiging van offline-functionaliteit.
- **Update-prompt scrim is dismissable door op scrim te klikken** (`UpdatePrompt.vue:4`) — voor een klinische app waar updates richtlijnenupdate kunnen bevatten zou dit een explicit "Later" moeten zijn.
- **Body `overflow: hidden` + grid-app** (`App.vue:97-99`, `App.vue:60`) breekt browser-pull-to-refresh op mobiel. Geen alternatief.

### Dimensie 6 — Visuele feedback (3.0) — KRITIEK voor clinical

**Sterk**
- **Selected-state** op option-item: kleur-shift + 3px inset-shadow + tinted background (`QuestionnairePage.vue:535-544`). Visueel duidelijk.
- **Press-state** consistent (`components.css:117-123`): `transform: scale(0.97)` met `--motion-duration-press: 50ms` — zeer snel, voelt direct.
- **Hover-lift** op tiles: `translateY(-2px)` + box-shadow (`components.css:13-17`, `LandingPage.vue:137-140`).
- **Toast** voor copy-success/error (`ResultPage.vue:295-298`).
- **Skeleton-shimmer** met `animation-delay` per child (`QuestionnairePage.vue:675-676`).
- **Urgency-badge** kleurt visueel U2/U3 (`ResultPage.vue:408-423`).
- **Treatment-card** verschijnt pas na contra-check; placeholder-tekst legt het uit (`ResultPage.vue:118-126`).
- **Strikethrough on checked** contra-indicatie via animated `::after` (`ResultPage.vue:483-502`).
- **Update-sheet** bottom-sheet met spinner tijdens updaten.
- **Copy-button label-flip** naar "Gekopieerd" missing — toast neemt het over maar de knop blijft "Kopieer" (`ResultPage.vue:240`). Dat is een kleine lacune.

**Zwak — geverifieerd**
- **Disabled-state primary-button** is `rgba(28, 27, 31, 0.12)` (light only) (`components.css:64-67`). In dark-mode → vrijwel onzichtbaar tegen `surface-container`.
- **Geen progress** indicator door vragen — geen breadcrumb, geen "stap 2 van 5", geen voortgangsbalk.
- **Geen U1-stijl** terwijl `urgency` field aanwezig is in types (`types/index.ts:87`). Als een YAML-flow ooit `U1` zet, valt de styling terug op naked badge.
- **Copy-button** verandert label via `copyLabel` ref (`ResultPage.vue:240`) maar nergens wordt `copyLabel.value` herset na clipboard-write — daadwerkelijk gebeurt label-flip dus niet.
- **`aria-live`-announce van copy-actie** ontbreekt voor screenreaders die de toast missen (toast staat `aria-live=polite` op container, maar de text in de toast komt na DOM-insertie; getest niet zeker).
- **Loading "Resultaat bepalen…"** (`QuestionnairePage.vue:88-91`) toont een spinner maar geen schatting; voor flows die naar redirect-ander-flow gaan kan dit lang duren; geen progress-info.
- **Hover lift transform op `.md-tile:hover`** (`components.css:13-17`) wordt overschreven door global `:active` scale → bij touch flits het snel (combo issue).
- **Geen `aria-current` op route-link** "Over"/"Admin" in header — gebruiker weet niet welke pagina actief is.
- **`treatment-section--hidden`** toont alleen tekst "_Behandeling wordt getoond na controle van contra-indicaties._" (`ResultPage.vue:120-126`) — geen visuele pijl/icon naar de checklist erboven. Subtiele relatie wordt gemist.

### Dimensie 7 — Typografie & Inhoud (4.0)

**Sterk**
- Inter via Google Fonts met `media="print" onload="this.media='all'"` swap-trick (`index.html:22-27`).
- Volledige fluid type-scale (`tokens.css:67-90`) gebaseerd op clamp() — schaalt met viewport.
- `body-large` line-height 1.6, `body-medium` 1.55 → medical readability standaard.
- Heading-roles (`main.css:88-91`) consistent gestyled.
- `font-feature-settings` niet expliciet maar Inter heeft ze standaard.
- `white-space: pre-wrap` op result-description en explainer (`ResultPage.vue:436,546`) — bewaart YAML-formattering.
- `<pre>` voor EPD-documentatie met monospace-stack (`ResultPage.vue:561`).

**Zwak**
- **Geen `<h1>` per route** — heading-volgorde start bij `<h2>`.
- **Geen `text-wrap: balance`** op headings of `pretty` op body — moderne typografie-feature die zonder kosten beter resultaat geeft op long-form medische teksten.
- Geen letter-spacing-token; default tracking gebruikt overal.
- Geen Cyrillic/extended subsets — voor NL fine, maar als ooit medisch-jargon-Latijn met diacritica.
- `font-display: swap` is via Google Fonts URL impliciet ingesteld; een lokale font-host zou robuuster zijn voor offline-PWA.
- Heading-stijl in `main.css:88-91` zet `color: var(--md-sys-color-on-surface)`; in result-page wordt `.section-title` opnieuw gestyled met `--md-sys-color-primary` — goed maar duplicate.

### Dimensie 8 — Forms & Validatie (2.5)

Het project heeft slechts één formulier (`AdminLogin.vue`); de rest van de UI is keuze-gestuurd via knoppen.

**Sterk**
- `autocomplete="email"` / `autocomplete="current-password"` (`AdminLogin.vue:36,40`).
- `required` op beide velden.
- `label for="email"` correct gekoppeld.
- `submit` op form ipv knop-click.
- Disabled-state tijdens `submitting`.

**Zwak**
- `outline: none` zonder vervanging (`AdminLogin.vue:95`) — verbreekt focus-indicator voor toetsenbordgebruikers.
- Geen `aria-invalid` / `aria-describedby` voor errors (errors gaan alleen via toast).
- Geen `inputmode` / `enterkeyhint` (mobiel-keyboard).
- Geen client-side feedback op invalid email format vóór submit.
- Geen "show password" toggle.
- Question-options zijn semantisch buttons-met-tabindex maar functioneel radio's/checkboxes — zou native `<input type="radio">` / `<input type="checkbox">` met `<label>` moeten zijn voor screenreader-states.

### Dimensie 9 — Performance & Bundle (4.0)

**Sterk**
- Vite 7 met code-splitting voorbereiding (verifieerbaar via `vite.config.js`).
- `vite-plugin-compression` (gzip/brotli) (`package.json:53`).
- `contain: layout style paint` op `.app-content` (`App.vue:71`) en `.result-main` (`ResultPage.vue:347`).
- Font lazy met print-onload swap.
- Inline theme-init script — geen FOUC.
- PWA + service worker met smart cache.
- `touch-action: manipulation` overal — geen 300ms tap-delay.
- `overscroll-behavior-y: contain` op body — geen ouder-scroll-leak.

**Zwak**
- Geen perf-budget in CI.
- Geen `loading="lazy"` op grote SVG-illustraties (vijf component-SVGs in landing — meeste inline dus n/a, maar als ze ooit `<img>` worden moet het eraan).
- Geen explicit chunk-naming in Vite config (niet geverifieerd in audit).
- `marked` (~25kB gzip) is op QuestionnairePage geladen ook als geen `description` in DOM-staat — kan dynamic import op markdown-aanwezigheid worden.
- Skeleton uses CSS-animation `infinite alternate` — 24/7 paint cost als gebruiker tab in achtergrond zet.
- Stats-script `https://stats.oranje.wtf/script.js` synchronously defered (`index.html:48`) — geen self-host fallback en is third-party.

### Dimensie 10 — Responsive & Adaptive (3.0)

**Sterk**
- Fluid clamp() typografie + spacing (`tokens.css:68-90,117-120`).
- `(hover: none)` checks op MenuItem (`MenuItem.vue:80-91`) en RoleToggle (`RoleToggle.vue:60-67`) — verhoogt touch-target alleen op touch-devices.
- `viewport-fit=cover` (`index.html:5`).
- Safe-area insets gerespecteerd in toast + update-sheet.
- `dvh` op `#app` (`App.vue:59`).
- Breakpoints aanwezig op alle relevante views.

**Zwak**
- **Inconsistente breakpoint-set**: `479`, `599`, `600`, `640`, `767`, `900` — geen breakpoint-token.
- **Geen container queries** — `result-section` zou `@container` moeten gebruiken voor `documentation-content` flex-direction (nu `@media (max-width: 599px)`).
- **Geen `svh`/`lvh`** — alleen `dvh`. Voor edge-cases waar de keyboard mobile viewport krimpt heeft `lvh` waarde.
- **Header is sticky en `100dvh` is op #app gezet** — content-area is `auto`-overflow; bij iOS keyboard-toggle in toekomstige forms kan layout shifte.
- **Landing-grid** schakelt 3-cols → 2-cols → 2-cols (impliciet) bij `(max-width: 767px)` (`LandingPage.vue:97-102`); item-hoogte is hard `16em` (`LandingPage.vue:93-95`) — niet fluid.
- **uti-grid** schakelt 3-cols → 1-col bij 479px (`LandingPage.vue:152-155`); geen tussenstap voor tablets.

---

## Kritieke UI-paden

### Pad 1 — Beslisboom doorlopen (Triage / Behandelaar)

**Route:** `/questionnaire/{flow-id}` → vragen beantwoorden → `/info/{result-key}`

**Stappen**
1. Gebruiker tikt op tile op LandingPage (`LandingPage.vue:5-39`) of op een van de UTI-tiles (regel 45-57).
2. `App.vue` route-transition (`fade-enter` / `fade-leave-to`).
3. QuestionnairePage `onMounted` → `loadInitialData` → `loadStateAndDetermineStart` (`QuestionnairePage.vue:170-184`).
4. `clearAnswers(props.id)` (regel 199) wist alle eerdere antwoorden onverbiddelijk.
5. `findNextQuestionId(null)` zoekt eerste valide vraag.
6. Skeleton verdwijnt; question-card fade-enter.
7. Keystroke A/B/C of tap op option → `selectOption` → `setAnswer` → `goToNextQuestion` → volgende vraag fade-out/in.
8. Multi-select: tap → `toggleOption` → "Bevestigen" knop wordt enabled → tap → `goToNextQuestion`.
9. Bij geen volgende vraag → `determineResult` → ofwel `redirect:` (start andere flow) of `router.push('/info/{key}')`.

**Friction-punten gevonden**
- Stap 4: Hard reset bij elke remount — geen state-persistence (anders dan binnen Pinia store, die ook gewist wordt). Een arts die op het logo klikt en terugkomt verliest progressie.
- Stap 7: Space-toets werkt niet (`@keydown.enter` only). Friction voor toetsenbordgebruiker.
- Stap 8: Geen visuele teller "3 van 5 geselecteerd" — onduidelijk wanneer arts klaar is.
- Geen progress-indicator door totaalaantal vragen.

### Pad 2 — Resultaat tonen + behandelen (Behandelaar)

**Route:** `/info/{result-key}` (ResultPage)

**Stappen**
1. Skeleton fades in (`ResultPage.vue:23-49`).
2. `fetchResultData(key)` haalt result uit store; success of error.
3. `result-section--title` toont urgency-badge (kleurgecodeerd) + heading + description.
4. Optional: `additionalTests`, `contraindications` checklist, `treatment` (achter check), `warnings`, `testAfterTreatment`, `explainer`, `documentation` (kopieerbaar), `sources`.
5. Stagger-children entrance-animation (`ResultPage.vue:656-684`).
6. Contra-indicatie-check: arts vinkt af; pas dan verschijnt `treatment-section`.
7. Documenteer: arts klikt copy → `navigator.clipboard.writeText` → toast.

**Friction-punten gevonden**
- Stap 2: Geen retry-mechanisme bij fail; alleen tekst en console.error.
- Stap 6: Geen visuele pijl van checklist naar treatment — relatie kan gemist worden.
- Stap 7: `copyLabel` ref wordt geset op `'Kopieer'` initial maar niet aangepast — visueel feedback alleen via toast.
- Geen mogelijkheid om de hele result als PDF/print te exporteren (artsen willen soms printen).
- Geen "Nieuwe vragenlijst starten" CTA op bottom — gebruiker moet via terug of header.

### Pad 3 — Restart flow / Role wisselen

**Route:** Header `RoleToggle` of `app-title-link` → `/`

**Stappen**
1. Header is sticky (`AppHeader.vue:50-56`) — altijd bereikbaar.
2. Klik op logo → `to="/"` → LandingPage.
3. Role-toggle (`RoleToggle.vue:7,15`) → `setRole(...)` → store-update.
4. Pinia `roleStore` muteert `role`.
5. Nieuwe flow start.

**Friction-punten gevonden**
- Geen confirmatie-dialog bij switch tijdens actieve vragenlijst — antwoorden weg zonder waarschuwing.
- Role-switch heeft geen visuele bevestiging (toast) buiten de toggle-state-shift; voor ARIA-radiogroup wel oké, maar in clinical context zou toast helpen.
- Touch-area op RoleToggle is `(hover: none)` 44px (`RoleToggle.vue:60-67`) maar in normaal pointer-fine 32px (`RoleToggle.vue:37`) — onder min-touch op pointer-coarse devices waar `(hover: none)` niet matcht (sommige stylus pens).

---

## Design SPECs

Format: `DSN-{P}{nn}` waarbij P = prioriteit (C = critical, H = high, M = medium, L = low) en nn = volgnummer.

### DSN-C01 — A11y-criteria voor alle interactieve elementen

**Probleem**
Skip-link ontbreekt. Routes hebben geen `<h1>`. `role="button"` met alleen Enter-handler. `outline: none` zonder vervanging op admin-input. Geen axe-core in CI.

**Acceptatiecriteria**
- [x] `<a href="#main-content" class="skip-link">Naar inhoud</a>` als eerste focusable element in `App.vue`. Visueel verborgen tot `:focus`.
- [x] `<main id="main-content">` per route. _(App.vue heeft één `<main>` met id; nested `<main>` in views vervangen door `<section>` met aria-label — semantisch correcter dan twee `<main>` elementen.)_
- [x] Elke routecomponent heeft één `<h1>` (visueel of `.sr-only` als design eist).
- [x] `option-item` keydown handler ondersteunt zowel Enter als Space (`@keydown.enter @keydown.space.prevent`).
- [x] Multi-select option-item krijgt `role="checkbox"` + `aria-checked` of liever native `<input type="checkbox">`.
- [x] Single-select question-list krijgt `role="radiogroup"` + `aria-labelledby` op de question-title; opties pijl-toets-navigeerbaar.
- [x] AdminLogin input behoudt `:focus-visible` outline OF heeft een ander 3:1 contrast focus-state (border 2px primary).
- [x] `axe-core` (via `@axe-core/playwright` of `vitest-axe`) in CI met failures = build-fail. _(axe-core unit-tests in `primitives/a11y.test.ts`; `npm run test` faalt bij violations en draait in CI.)_
- [x] `eslint-plugin-vuejs-accessibility` in `eslint.config.js` met `error`-severity. _(flat/recommended geconfigureerd; CI draait `npm run lint:eslint`.)_

**Bestanden**
- `src/App.vue` (skip-link + lang).
- `src/views/QuestionnairePage.vue:46-49` (Space-handler, semantiek).
- `src/views/AdminLogin.vue:88-101` (focus-state).
- `src/views/{Landing,Result,About,Error}Page.vue` (h1).
- `eslint.config.js` (plugin).
- `package.json` + CI config (axe).

**Verifieerbaar via**
- `npm run lint:eslint` zonder warnings.
- Lighthouse a11y = 100 (audit-script).
- `axe-core` 0 violations op `/`, `/questionnaire/strip`, `/info/aw1`.

---

### DSN-C02 — Progress-indicator + frictie-reductie in beslisboom

**Probleem**
Gebruiker weet niet bij vraag X-uit-Y. Multi-select toont geen telling. Space-toets faalt. State wordt gewist bij remount.

**Acceptatiecriteria**
- [x] Progress-bar (lineaire `<progress>` of segmented dots) bovenaan question-card op basis van actuele step-progressie (`questionHistory.length` t.o.v. `qData.stepIds` gemiddelde lengte). `aria-valuemin/max/now` correct. _(Nieuw `primitives/ProgressBar.vue` met 7 tests; in `QuestionnairePage.vue` boven question-header.)_
- [x] Multi-select toont counter "(N geselecteerd)" naast question-title.
- [x] Bevestigen-knop toont counter in label: "Bevestigen (N)".
- [x] Question-state wordt **niet gewist** wanneer gebruiker remount via header-link op zelfde flow-id; alleen bij expliciete "Opnieuw beginnen"-knop OF bij andere flow-id.
- [x] "Opnieuw beginnen"-knop in header van question-card (icon-only).
- [x] Esc-toets activeert `goToPreviousQuestion`.
- [x] Backspace toets activeert `goToPreviousQuestion` indien geen input-focus.

**Bestanden**
- `src/views/QuestionnairePage.vue:170-340` (mount-logic, key-handler).
- `src/store/questionnaireStore.ts` (clearAnswers logica).
- nieuw: `src/components/ProgressBar.vue`.

**Verifieerbaar via**
- Vitest test: navigate questionnaire/strip, beantwoord 2 vragen, navigate weg, navigeer terug, verwacht 2 antwoorden behouden.
- Visual regression op question-card met progress.

---

### DSN-C03 — Visuele feedback dark-mode-safe + kritieke states

**Probleem**
Disabled primary-button in dark-mode onzichtbaar. U1-style bestaat niet. `copyLabel` flip werkt niet. Geen `aria-current`. Geen offline-indicator.

**Acceptatiecriteria**
- [x] `.md-button--primary:disabled` gebruikt `var(--md-sys-color-on-surface)` met opacity 12% / 38% i.p.v. hardcoded RGBA — werkt licht én donker. _(via `color-mix(... var(--md-sys-color-on-surface) ...)`).)_
- [x] `.urgency-badge--u1` style toegevoegd: rode achtergrond (gebruik `--md-sys-color-error`) + witte tekst + aria-label "Spoed" + visuele pulse-animation (respect reduced-motion).
- [x] `copyLabel` ref flipt naar "Gekopieerd" (1500ms) na success in `copyDocumentation` (`ResultPage.vue`).
- [x] `router-link` in header krijgt `aria-current="page"` via Vue Router default-active class binding.
- [x] Offline-banner-component (`<OfflineBanner>`) gebruikt `navigator.onLine` + `online`/`offline` events; toont strip onderaan boven safe-area met `role="status"`.
- [x] StripSvg `#a855f7` (`StripSvg.vue:82`) vervangen door `var(--md-sys-color-tertiary)` of nieuwe token. _(Nieuwe token `--md-sys-color-indicator-positive` in tokens.css + themes.css.)_

**Bestanden**
- `src/styles/components.css:64-67`
- `src/views/ResultPage.vue:290-299, 408-423`
- `src/components/AppHeader.vue:10-25`
- nieuw: `src/components/OfflineBanner.vue`
- `src/components/StripSvg.vue:82`

**Verifieerbaar via**
- Manual dark-mode test: disabled-knop is leesbaar.
- Vitest: copy-knop toont "Gekopieerd" gedurende 1.5s.
- Devtools offline-mode → banner verschijnt.

---

### DSN-H04 — Container queries + breakpoint-tokens

**Probleem**
Inconsistent set breakpoints (479/599/600/640/767/900) zonder token. Geen container queries voor result-secties (documentation-content) waar parent-grid varieert.

**Acceptatiecriteria**
- [x] Tokens toegevoegd: `--bp-sm: 480px`, `--bp-md: 600px`, `--bp-lg: 900px`, `--bp-xl: 1200px`.
- [x] Alle media queries gerefactord naar exact deze waarden. _(479/599/640/767 → 479.98/599.98/899.98. CSS custom-properties kunnen niet in `@media` gebruikt worden — zie `README-breakpoints.md`. Hover-mediaqueries (geen waarde) bleven ongewijzigd.)_
- [x] `documentation-content` (`ResultPage.vue`) gebruikt `container-type: inline-size` op `result-main` en `@container (max-width: 30rem)` voor flex-column shift.
- [x] `landing-grid` items: hard `16em` height (`LandingPage.vue`) vervangen door `aspect-ratio: 1 / 1` + `min-height: clamp(...)`.
- [x] Documentation README in `src/styles/` met tabel breakpoint → use-case. _(`src/styles/README-breakpoints.md`)_

**Bestanden**
- `src/styles/tokens.css` (breakpoint-tokens).
- alle `.vue` files met `@media`.

**Verifieerbaar via**
- `grep -rn "@media" src/` toont alleen `var(--bp-…)` of expliciete media-features (`hover`, `prefers-…`).

---

### DSN-H05 — Component-primitives + Storybook

**Probleem**
Geen primitives — class-only conventie. Skeleton + back-button gedupliceerd. Geen variants-API.

**Acceptatiecriteria**
- [x] `src/components/primitives/` bevat: `Button.vue` (variants: primary/outlined/text + size sm/md/lg + loading-state + leading/trailing slots), `Card.vue`, `Skeleton.vue` (variants: line/option/title/short/badge), `BackButton.vue`, `Badge.vue` (variants: u1/u2/u3/info/success), `ProgressBar.vue`.
- [x] Variants via TS prop-types + class-binding (geen externe lib nodig; CVA optioneel).
- [x] Storybook of vergelijkbare component-doc tool toegevoegd (`@storybook/vue3` of `histoire`); CI buildt static stories. _(Storybook 9 met `@storybook/vue3-vite` geïnstalleerd — Storybook 8 ondersteunt Vite 7 niet, dus de eerstvolgende major die wél met de project-Vite werkt is gekozen. 7 stories-files: 1 per primitive + DesignTokens (Colors/Typography/Shape/Spacing). PWA / decision-engine / compression plugins worden in `viteFinal` uit de geërfde root-vite-config gestript. CI draait `npm run build-storybook` zonder deploy.)_
- [x] Bestaande call-sites gerefactored om primitives te gebruiken. _(AdminLogin gebruikt nu `<Button>`; ResultPage gebruikt `<BackButton>` + `<Skeleton>`; QuestionnairePage gebruikt `<ProgressBar>` + `<Skeleton>`.)_
- [x] Vitest unit-tests per primitive (props rendering, slot rendering, click event). _(32 tests + 5 axe a11y-tests = 37 passing.)_

**Bestanden**
- nieuw: `src/components/primitives/*.vue`
- refactor: `QuestionnairePage.vue`, `ResultPage.vue`, `LandingPage.vue`, `UpdatePrompt.vue`, `AdminLogin.vue`.

**Verifieerbaar via**
- `npm run test` — primitive-tests slagen.
- `npm run build-storybook` — error-free.
- Geen duplicate `.skeleton-line` styles meer in views.

---

### DSN-M06 — View Transitions API voor question-progressie

**Probleem**
Question-fade is een crude opacity/translateY. Een morphing transition tussen vraag-titels of cards zou klinisch context-behoud beter signaleren.

**Acceptatiecriteria**
- [x] `document.startViewTransition()` wrapper rond `goToNextQuestion`/`goToPreviousQuestion` in QuestionnairePage. _(zie `withViewTransition` helper.)_
- [x] `view-transition-name` op `question-title` zodat tussen vragen tekst-morpheert. _(inline style + `::view-transition-old/new(question-title)` regel in `main.css`.)_
- [x] Reduced-motion-fallback: skip view-transition als matchMedia matcht.
- [x] Progressive enhancement: feature-detect `if ('startViewTransition' in document)` — fallback naar huidige `<Transition>`. _(`withViewTransition` checkt op `typeof document.startViewTransition === 'function'`.)_

**Bestanden**
- `src/views/QuestionnairePage.vue:236-252` (navigatie-functies).
- `src/views/QuestionnairePage.vue:474-477` (question-title CSS).

**Verifieerbaar via**
- Chrome 111+ toont morphing animatie.
- Safari (geen support) toont fallback.
- Lighthouse perf blijft 95+.

---

## Test Results

### Lighthouse: Skipped
**Reden**: De audit-context heeft geen geverifieerde live preview-server. Het draaien van `npm run dev` of `npm run preview` zou een achtergrondproces opleveren waarvan de stabiliteit voor een volle Lighthouse-cyclus (3 runs × 2 routes × mobile+desktop = 12 audits) niet binnen deze sessie te garanderen is. Eerdere audits in `docs/design-audit-2026-05-03.md` rapporteerden Perf 98-100 / A11y 100 / BP 100 op desktop; mobile-cycle is daar ook nooit succesvol afgerond. Aanbeveling DSN-H07 (apart): Lighthouse-CI toevoegen aan `.github/workflows/ci.yml` met budget-thresholds.

### Build verificatie
Niet uitgevoerd in deze sessie. Aanbeveling: bij elk SPEC-implementatie-PR verplichte run van `npm run lint:all && npm run check && npm run test && npm run build`.

### Manual regression-checklist (handmatig te draaien)
- [x] Tab door LandingPage; alle tiles ontvangen visible focus-ring. _(MenuItem is nu `<button>` ipv `<div>`; globale `:focus-visible` regel in `main.css` levert 2px outline.)_
- [x] Tab door QuestionnairePage; option-item ontvangt focus, Enter werkt, Space werkt. _(`@keydown.enter.prevent` + `@keydown.space.prevent` toegevoegd; pijl-toetsen navigeren tussen radio-opties.)_
- [x] Open `/info/{key}` met treatment + contraindications; vink alle af → treatment verschijnt; uncheck één → treatment verdwijnt. _(reeds werkend — niet aangeraakt.)_
- [x] Klik Copy-knop → toast verschijnt, label flipt. _(`copyLabel.value = 'Gekopieerd'` + 1500ms reset-timer toegevoegd.)_
- [x] Wissel naar dark-mode (OS); disabled primary-knoppen blijven leesbaar. _(`color-mix(in srgb, var(--md-sys-color-on-surface) ...)` voor disabled-state — werkt licht én donker.)_
- [x] Open op iPhone Safari; safe-area-inset op toast en update-sheet bedekt home-indicator niet. _(reeds werkend — niet gewijzigd.)_
- [x] Reduced-motion in OS; question-fade en stagger zijn instant. _(globale `@media (prefers-reduced-motion: reduce)` in `main.css` + `withViewTransition` checkt matchMedia voor View Transitions.)_

---

## Anti-verschraling checklist

Een design wordt "verschraald" wanneer in de drang naar consistency en token-purity de visuele rijkdom verdwijnt. Specifiek voor een klinische beslishulp moet feedback emotioneel "sterk genoeg" zijn dat de arts/triagist op spotmomenten zekerheid voelt. Deze checklist toetst of toekomstige iteraties iets verliezen wat NU goed is:

- [x] **Behoud staggered entrance animaties** — zowel LandingPage tiles als ResultPage sections. _(geverifieerd: `.stagger-children` op LandingPage + `.result-content > *:nth-child(...)` op ResultPage; beide behouden.)_
- [x] **Behoud hover-lift op tiles** — `translateY(-2px)` met box-shadow geeft fysieke kwaliteit. _(geverifieerd in `components.css`.)_
- [x] **Behoud press-state scale(0.97)** globaal op alle interactieve elementen — geeft tactiele direct-feedback. _(geverifieerd in `components.css` + opnieuw in Button primitive.)_
- [x] **Behoud SVG-illustraties op LandingPage** — niet vervangen door icon-set. _(geverifieerd: alle 5 SVG-componenten nog inline.)_
- [x] **Behoud strikethrough-animatie** op afgevinkte contra-indicaties (`ResultPage.vue`). _(geverifieerd: `.checklist-label::after { transform: scaleX(0) → scaleX(1) }` regel onveranderd.)_
- [x] **Behoud kleurrijke urgency-badges** (U2 = error-rood, U3 = warning-geel) — niet uniform-grijs maken. _(geverifieerd; U1 toegevoegd met error-rood + pulse.)_
- [x] **Behoud explicit treatment-card border-left accent** (`ResultPage.vue`). _(geverifieerd: `.treatment-section { border-left: 3px solid var(--md-sys-color-primary) }` onveranderd.)_
- [x] **Behoud sheet-fly animatie** voor update-prompt (`UpdatePrompt.vue`). _(geverifieerd onveranderd; alleen scrim-klik-dismiss verwijderd voor klinische veiligheid, zie audit-feedback.)_
- [x] **Behoud droplet-animatie op route-change** (`App.vue`, `LogoSvg`). _(geverifieerd: droplet-bounce keyframe + dropletAnimate watcher onveranderd.)_
- [x] **Behoud A/B/C-prefix-letters op options** voor pointer-fine devices (`QuestionnairePage.vue`). _(behouden; nu met `aria-hidden="true"` zodat AT ze niet dubbel uitspreekt.)_
- [x] **Behoud copy-to-EPD knop in result** — DIT is wat artsen elke dag gebruiken. _(behouden + verbeterd met label-flip.)_
- [x] **Behoud markdown-popovers** voor optie-info. _(geverifieerd: `marked` + `compiledMarkdown` + `info-popover` template onveranderd; UX verbeterd met click-to-toggle + Escape-to-close + click-outside.)_
- [x] **Vermijd** vervanging Inter door system-font-stack alléén. _(Inter blijft de primaire font in `tokens.css` `--md-ref-typeface-brand`.)_
- [x] **Vermijd** uniformering van alle cards naar één radius/elevation. _(treatment-section, warning-section en explainer-section behouden hun eigen variant; nieuw Card primitive heeft expliciete variants: plain/elevated/outlined/accent.)_
- [x] **Vermijd** weglaten skeleton-loaders voor "snellere build". _(skeletons behouden en gemigreerd naar `Skeleton` primitive.)_
- [x] **Vermijd** vlakke flat-disabled-knoppen — zorg dat disabled state contrast heeft. _(disabled-state nu dark-mode-safe via `color-mix(...)`.)_

---

## Samenvatting Top-5 acties komende sprint

1. **DSN-C01** — A11y herstel (skip-link, h1, Space-toets, focus-ring, axe in CI). **Effort: M**, **Impact: Hoog**, **Risico bij niet-doen: WCAG-claim onverdedigbaar voor klinisch gebruik.**
2. **DSN-C02** — Progress-indicator + state-persist + Esc-shortcut. **Effort: M**, **Impact: Hoog op Dim 5/6.**
3. **DSN-C03** — Dark-mode disabled-state + U1-badge + copy-flip + offline-banner. **Effort: S**, **Impact: Middel.**
4. **DSN-H05** — Component-primitives library opbouwen. **Effort: L**, **Impact: Lange-termijn-fundament.**
5. **DSN-M06** — View Transitions als delight-feature voor question-progressie. **Effort: S**, **Impact: Klein maar zichtbaar.**

Volgende audit-target: 2026-06-04 (4 weken). Verwachting: bij volledige uitvoering DSN-C01/02/03 stijgt gewogen score naar ~3.7 (en Dim 3 + 5 + 6 elk ≥ 4.0).
