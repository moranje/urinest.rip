[![Banner](/assets/banner.png)](https://www.linkedin.com/in/martienoranje/)

<h1 align="center">
URINEST.RIP
</h1>

Clinical decision support for urine testing in Dutch primary care. The production app is also the
first real consumer for reusable `@beslismodel/*` framework packages.

## Website

Latest production version: [www.urinest.rip](https://www.urinest.rip/)

## What This Repo Contains

- Vue 3 + Vite 8 SPA for clinical urine test workflows.
- YAML decision flows in `flows/`.
- `@beslismodel/compiler` build step to generate `public/main.json`.
- Reusable framework package sources in `packages/`.
- Urinestrip consumer fixture in `fixtures/urinestrip-consumer/`.
- App, package, browser, guideline, telemetry and design regression gates.

Current package state:

- stable registry version consumed by the app: `@beslismodel/*@0.1.0`;
- prerelease lane published for rollback/comparison: `0.1.0-next.1` with dist-tag `next`;
- NAS handoff for publish/migration work: [docs/nas-handoff-2026-06-04.md](docs/nas-handoff-2026-06-04.md).

## Requirements

- Node `>=20.19.0`
- npm
- optional local `.env` with Supabase settings for app log persistence/auth flows

Project `.npmrc` may route scopes to Gitea, but must not contain auth tokens.

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

Framework/package gate:

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

## Package Release

Package publishing is guarded and npm-native:

```bash
npm run check:package-publish-next
BESLISMODEL_PUBLISH_CONFIRM=<exact-version> npm run check:package-publish-next -- --publish
```

Registry smoke:

```bash
BESLISMODEL_REGISTRY_SMOKE_VERSION=<exact-version> npm run check:package-registry-smoke
```

Do not publish prereleases to `latest`. Stable publish needs an exact stable version and release
notes.

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
- theme toggle uses generated central design token metadata.

## Documentation For Agents

- [AGENTS.md](AGENTS.md) — local agent rules and invariants.
- [docs/framework-package-plan-2026-06-01.md](docs/framework-package-plan-2026-06-01.md) — package/framework plan.
- [docs/ai-guideline-authoring.md](docs/ai-guideline-authoring.md) — AI-oriented guideline authoring contract.
- [docs/package-release-strategy.md](docs/package-release-strategy.md) — package release strategy.
- [docs/gitea-package-publishing.md](docs/gitea-package-publishing.md) — Gitea registry runbook.

## License

GNU General Public License v3.0. See [LICENSE.md](LICENSE.md).
