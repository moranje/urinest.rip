# urinest.rip — Beslishulp urineonderzoek

## Project

Vue 3 + Vite 8 SPA voor huisartsen. Klinische beslisbomen staan in `flows/` en worden via
`@beslismodel/compiler` gecompileerd naar `public/main.json`.

Het doel van deze repo is tweeledig:

- productie-app `urinest.rip` stabiel houden;
- herbruikbaar `@beslismodel/*` framework bouwen en testen, met Urinestrip als eerste consumer.

## Tech Stack

- Vue 3, Vue Router, Pinia
- TypeScript 6, `vue-tsc`, `@typescript/native-preview` / `tsgo`
- Vite 8 / Rolldown via Vite library builds
- `@beslismodel/core`, `@beslismodel/compiler`, `@beslismodel/vue`
- domain packages: `@beslismodel/cvrm-prevent`, `@beslismodel/copd-care`, `@beslismodel/dm-care`
- `@beslismodel/testing` voor snapshots, role/context matrices en consumer fixtures
- Supabase alleen app-side: auth + structured logging
- PWA via `vite-plugin-pwa`
- formatting/linting: `oxfmt`, `oxlint`, ESLint security/a11y rules

## Commands

- `npm run dev` — lokale dev server
- `npm run build` — productie build
- `npm run check:app` — volledige app gate
- `npm run check:framework` — framework/package gate
- `npm run check:packages` — package builds, tarballs, publish dry-run, consumer smokes
- `npm run check:browser-smoke` — browser regressies: landing grid, routes, back, theme, popovers
- `npm run check:guidelines` — traceability, rolmatrix, klinische copy
- `npm run check:modern-toolchain` — borgt `oxfmt`, `oxlint`, `tsgo`, Vite 8 en Rolldown
- `npm run test` — app + package Vitest suites
- `npm run format:check` — oxfmt check
- `npm run lint:all` — oxlint + ESLint

Gebruik bij inhoudelijke lokale afronding minimaal:

```bash
npm run check:app
npm run check:browser-smoke
```

Gebruik bij package/framework werk:

```bash
npm run check:packages
npm run check:package-registry-smoke:current
```

## Framework Packages

Alle `@beslismodel/*` packages gebruiken lockstep versies tot externe consumers anders bewijzen.

Huidige registry-status:

- gepubliceerd en door app gebruikt: `0.1.0-next.0`
- lokaal voorbereid maar nog NAS-publish nodig: `0.1.0-next.1`

Geen token in project `.npmrc` committen. Scope routing mag:

```text
@beslismodel:registry=https://git.oranje.wtf/api/packages/martien/npm/
```

Package publish blijft npm-native. Baseline actions horen bij app CI/release, niet bij
`@beslismodel/*` publish zelf.

## Richtlijn Review-Datums

Bij inhoudelijke wijzigingen aan `flows/`:

1. controleer bronrichtlijn;
2. update relevante reviewdatum in `src/lib/guidelines.ts`;
3. update traceability/role evidence waar nodig;
4. vermeld richtlijn in committekst als klinische inhoud wijzigt.

Actieve bronnen:

- NHG-Standaard Urineweginfecties
- NHG-TriageWijzer Urinewegproblemen
- Verenso richtlijn Urineweginfecties
- NVKC richtlijn Urineonderzoek
- NVU richtlijn Hematurie

## Flows

YAML bestanden in `flows/`. Elke flow heeft:

- `id`, `version`, `title`, `description`
- `questions`
- `steps`
- `results`
- `resultsLogic`

Validatie gebeurt via `@beslismodel/compiler` tijdens `build:flows`, Vite plugin en package
consumer smokes.

## Rollen

App runtime kent:

- **Behandelaar**: arts/verpleegkundige, behandelopties, doseringen, documentatie
- **Triage**: triagist/doktersassistent, vervolgonderzoek, verwijscriteria

Generieke frameworkrollen zoals DA/VPK/POH worden via `docs/role-responsibility-matrix.json` naar
runtime rollen gemapt. `npm run check:guidelines` moet voorkomen dat triage behandelvragen of
behandelresultaten kan bereiken.

## UI/UX Regressie-Invarianten

Niet breken zonder expliciete user-goedkeuring:

- desktop landing grid: vijf primaire flows renderen als 2 rijen x 3 kolommen (`3 + 2`);
- geen custom UI back button in klinische flow als browser back native beschikbaar is;
- elke vraagstap moet browsergeschiedenis krijgen, ook na jump tussen vragenlijsten;
- direct `/info/:resultKey` mag niet blijven hangen op shell loader;
- progressbar heeft geen misleidende numerieke tekst;
- answer cards krijgen geen volle groene frame-border;
- checkbox styling blijft component-owned, geen extra rij/label-border;
- notice/info componenten bepalen eigen padding;
- theme toggle gebruikt centrale design tokens en generated theme metadata.

Beschermende tests/scripts:

- `src/components/templates/LandingTemplate.test.ts`
- `src/__tests__/route-visual-contract.test.ts`
- `scripts/check-browser-regression-smoke.mjs`
- `src/components/molecules/ChoiceOption.test.ts`
- `src/components/primitives/FormControls.test.ts`
- `src/components/molecules/Notice.test.ts`

## Telemetry/Security

- Supabase/log persistence is app-only.
- Packages blijven Supabase-vrij.
- Dev log persistence alleen opt-in via `VITE_ENABLE_LOG_PERSISTENCE=true`.
- PHI/PII niet loggen; gebruik `src/lib/clinical-scrubber.ts`.
- `Transition was skipped` is benign view-transition gedrag en mag geen user-facing error worden.

## CI/CD

GitHub Actions en Gitea workflows voeren app/framework gates uit. Gitea app workflows gebruiken
baseline actions voor npm auth, node setup, sourcemaps en release finalize. Package publish wordt
apart bewaakt door:

- `check:package-release-config`
- `check:package-release-notes`
- `check:package-publish-next`
- `check:package-registry-smoke`

## Commits

Atomic conventional commits. Types:

- `feat`
- `fix`
- `docs`
- `chore`
- `ci`
- `refactor`
- `test`

Niet mengen:

- UI fix met docs-only update;
- package version bump met CSS;
- registry publish/migration met unrelated cleanup.

## NAS Handoff

Voor breed cross-repo werk: lees `docs/nas-handoff-2026-06-04.md`.

NAS-run moet `/code` of alle sibling repos als echte writable roots hebben. VS Code workspace
folders alleen zijn niet genoeg als agent/runtime sandbox `.git/index` of package files niet mag
schrijven.
