# urinest.rip — Agent Context

Primary agent instructions live in [AGENTS.md](AGENTS.md). Keep this file aligned with that source.

## Current Architecture

- Vue 3 + Vite 8 app for Dutch urine-test decision support.
- Flows live in `flows/`.
- `@moranje/beslismodel/compiler` builds `public/main.json`.
- App consumes `@moranje/beslismodel@0.1.1` from GitHub Packages.
- Framework source lives in `moranje/beslismodel-framework`; this repo is a consumer.

## Required Gates

Use app gate for local app/doc/test changes:

```bash
npm run check:app
```

Use framework gate for package changes:

```bash
npm run check:framework
```

Use browser smoke for UI/navigation regressions:

```bash
npm run check:browser-smoke
```

## Clinical Flow Changes

For any substantive `flows/` change:

- verify source guideline currency;
- update review metadata in `src/lib/guidelines.ts`;
- update `docs/guideline-traceability.json` and role evidence if visible question/result logic changes;
- run `npm run check:guidelines`.

## Non-Negotiable UI Invariants

- Desktop landing grid: five primary flows stay 2 rows x 3 columns.
- Browser back is clinical navigation model; no duplicate flow back button.
- Direct `/info/:resultKey` route must render without loader hang.
- Progressbar does not show misleading numeric text.
- Answer, checkbox and notice components must not regain extra full-frame borders.
- Theme is system-only and initialized before first paint from generated design token metadata.

## Package Status

- Consumed registry version: `@moranje/beslismodel@0.1.1`.
- Historical split-package prerelease lane: `0.1.0-next.1` with dist-tag `next`.
- NAS handoff for publish/migration: [docs/nas-handoff-2026-06-04.md](docs/nas-handoff-2026-06-04.md).

## Commit Rules

Atomic conventional commits only. Do not mix package version bumps, UI fixes, docs cleanup and
registry migration in one commit.
