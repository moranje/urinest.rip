[![Banner](/assets/banner.png)](https://www.linkedin.com/in/martienoranje/)

<h1 align="center">
URINEST.RIP
</h1>

Clinical decision support for urine testing in Dutch primary care. The production app is also the
first real consumer for the reusable `@moranje/beslismodel` framework package.

## Website

Latest production version: [www.urinest.rip](https://www.urinest.rip/)

## What This Repo Contains

- Vue 3 + Vite 8 SPA for clinical urine test workflows.
- YAML decision flows in `flows/`.
- `@moranje/beslismodel/compiler` build step to generate `public/main.json`.
- Reusable framework package source lives in `moranje/beslismodel-framework`.
- Urinestrip consumer fixture in `fixtures/urinestrip-consumer/`.
- App, consumer, browser, guideline, telemetry and design regression gates.

Current package state:

- stable GitHub Packages version consumed by the app: `@moranje/beslismodel@0.1.1`;
- subpath exports replace the old split `@beslismodel/*` packages;
- NAS handoff for publish/migration work: [docs/nas-handoff-2026-06-04.md](docs/nas-handoff-2026-06-04.md).

## Requirements

- Node `>=24.0.0`
- npm
- optional local `.env` with Supabase settings for app log persistence/auth flows

Project `.npmrc` may route `@moranje` to GitHub Packages, but must not contain auth tokens.

## Setup

```bash
npm ci
```

## Development

Start Vite dev server:

```bash
npm run dev
```

Default local URL:

```text
http://localhost:5173
```

## Core Gates

App gate:

```bash
npm run check:app
```

Framework consumer gate:

```bash
npm run check:framework
```

Browser regression smoke:

```bash
npm run check:browser-smoke
```

Guideline evidence gate:

```bash
npm run check:guidelines
```

Modern toolchain guard:

```bash
npm run check:modern-toolchain
```

## Production

Build production app:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Framework Package

`urinest.rip` consumes `@moranje/beslismodel` from GitHub Packages. Framework source, package
builds, package tests and package publishing live in
[`moranje/beslismodel-framework`](https://github.com/moranje/beslismodel-framework).

## Clinical Content

When changing `flows/`:

- check current source guideline;
- update review metadata in `src/lib/guidelines.ts`;
- update traceability and role evidence where needed;
- run `npm run check:guidelines`.

Active guideline families:

- NHG-Standaard Urineweginfecties
- NHG-TriageWijzer Urinewegproblemen
- Verenso richtlijn Urineweginfecties
- NVKC richtlijn Urineonderzoek
- NVU richtlijn Hematurie

## UI Invariants

Important regressions are covered by tests and browser smoke:

- desktop landing grid remains 2 rows x 3 columns for five primary flows;
- browser back is the clinical navigation model;
- direct `/info/:resultKey` renders without loader hang;
- progressbar avoids misleading numeric text;
- answer, checkbox and notice components avoid unwanted extra borders;
- answer-info popovers open without selecting answers, restore focus, stay inside viewport and clean up stale popover state;
- system theme is selected before first paint from generated central design token metadata.

## Documentation For Agents

- [AGENTS.md](AGENTS.md) — local agent rules and invariants.
- [docs/framework-package-plan-2026-06-01.md](docs/framework-package-plan-2026-06-01.md) — package/framework plan.
- [docs/ai-guideline-authoring.md](docs/ai-guideline-authoring.md) — AI-oriented guideline authoring contract.
- [docs/package-release-strategy.md](docs/package-release-strategy.md) — current aggregate package strategy.
- [docs/gitea-package-publishing.md](docs/gitea-package-publishing.md) — historical split-package/Gitea staging runbook.

## License

GNU General Public License v3.0. See [LICENSE.md](LICENSE.md).
