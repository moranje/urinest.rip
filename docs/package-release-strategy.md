# Beslismodel Package Release Strategy

Purpose: keep `urinest.rip` a clean consumer of the reusable beslismodel framework while package
source, package CI and package publishing live outside this app repository.

## Current Package Shape

Active consumer package:

- `@moranje/beslismodel@0.1.1`

Registry:

- GitHub Packages: `https://npm.pkg.github.com`
- Scope routing: `@moranje:registry=https://npm.pkg.github.com`
- Auth: user-level npm config or CI `GITHUB_PACKAGES_TOKEN`; never commit `_authToken`.

Public subpath exports replace the old split package set:

- `@moranje/beslismodel/core`
- `@moranje/beslismodel/compiler`
- `@moranje/beslismodel/vue`
- `@moranje/beslismodel/testing`
- `@moranje/beslismodel/cvrm-prevent`
- `@moranje/beslismodel/copd-care`
- `@moranje/beslismodel/dm-care`

Historical note: the earlier local/Gitea split packages under `@beslismodel/*` were release-staging
artifacts. The app now consumes the aggregate package only.

## Repository Boundaries

`urinest.rip` owns:

- YAML flows and clinical Dutch copy.
- App shell, Supabase logging/admin UI, PWA branding and Urinest taxonomy/icons.
- Consumer fixture proving app usage through public package exports.
- App/browser/guideline/telemetry/design gates.

`moranje/beslismodel-framework` owns:

- Framework source.
- Package build and package tests.
- Package release workflow.
- Package versioning, tags and publication.

No `packages/` source tree or package-only gate may return to this app repository.

## App Consumer Gates

Required before deploying or accepting package migration changes:

- `npm ci`
- `npm run check:app`
- `npm run check:framework`
- `npm run check:browser-smoke`
- `npm run check:lighthouse`
- `npm audit --omit=dev --audit-level=high`

`check:framework` in this app is intentionally a consumer gate:

- `npm run check:consumer-imports`
- `npm run check:consumer:urinestrip:only`
- `npm run test:consumer:urinestrip:only`

It must not rebuild or test package source from this repository.

## Release Rules

- Pin exact package versions in app `package.json` and `package-lock.json`.
- Lockfile must resolve `node_modules/@moranje/beslismodel` from `npm.pkg.github.com`.
- App imports must use public `@moranje/beslismodel/*` exports only.
- Do not import from `packages/*`, package `src/`, package `dist/` internals or legacy
  `@beslismodel/*` split packages.
- Package source changes require a package release in `moranje/beslismodel-framework` before the app
  version pin changes.

## CI

GitHub CI runs on Node 24 and uses GitHub Packages auth:

- `actions/setup-node` with `registry-url: "https://npm.pkg.github.com"` and `scope: "@moranje"`.
- `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_PACKAGES_TOKEN }}` for package install.
- App checks, framework consumer checks, browser smoke, Lighthouse, guideline gates and npm audit.

Docs-only changes are still expected to run CI when they alter package strategy, framework handoff,
agent instructions or release runbooks.

## Rollback

Rollback must stay boring:

- Revert the app package pin to the previous known-good `@moranje/beslismodel` version.
- Restore the matching `package-lock.json` from git history.
- Run `npm ci`, `npm run check:app`, `npm run check:framework`, `npm run check:browser-smoke`.
- Keep package release notes in the framework repository as the source of package-level rollback
  details.
