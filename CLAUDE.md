# urinest.rip — Agent Context

Primary agent instructions live in [AGENTS.md](AGENTS.md). Keep this file aligned with that source.

## Current Architecture

- Vue 3 + Vite 8 app for Dutch urine-test decision support.
- Flows live in `flows/`.
- `@beslismodel/compiler` builds `public/main.json`.
- App consumes published `@beslismodel/*` packages from Gitea.
- Package source remains in `packages/` while `beslismodel-framework` publish/migration work is staged.

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
- Theme toggle uses central generated design token metadata.

## Package Status

- Consumed registry version: `0.1.0-next.0`.
- Prepared local prerelease: `0.1.0-next.1`.
- NAS handoff for publish/migration: [docs/nas-handoff-2026-06-04.md](docs/nas-handoff-2026-06-04.md).

## Commit Rules

Atomic conventional commits only. Do not mix package version bumps, UI fixes, docs cleanup and
registry migration in one commit.
