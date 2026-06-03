# Beslismodel Package Release Strategy

Purpose: publish `@beslismodel/*` as standalone framework packages while keeping `urinest.rip` working as first consumer.

## Package Set

Initial lockstep set:

- `@beslismodel/core`
- `@beslismodel/compiler`
- `@beslismodel/cvrm-prevent`
- `@beslismodel/vue`
- `@beslismodel/testing`

All five packages use same version until external consumers prove independent release lanes are needed. Internal dependencies must pin same framework version, for example `@beslismodel/vue -> @beslismodel/core`.

Package manifests must include:

- `engines.node >=20.19.0`
- `files: ["dist"]`
- description, license, repository, homepage, bugs and keywords
- `prepack` build hook so stale `dist` cannot be packed

## Semver

- `patch`: bug fixes, test utilities, docs, non-breaking validation improvements.
- `minor`: new public exports, new optional adapters, new schema fields with backward compatibility.
- `major`: removed exports, changed runtime contracts, stricter schema that rejects previously valid flows, peer dependency range breaks.

Clinical flow data is not part of framework semver. Domain packages own clinical versioning, guideline review dates and source traceability.

## Registry

Target registry: local Gitea npm registry.

Required before publish:

- Gitea owner/scope selected.
- User-level `.npmrc` contains token only; project `.npmrc` must never contain secrets.
- Each package gets `publishConfig.registry` for Gitea once final registry URL is known.
- First publish uses prerelease version and dist-tag `next`, not `latest`.

Example publish order:

```bash
npm publish packages/core --tag next
npm publish packages/compiler --tag next
npm publish packages/cvrm-prevent --tag next
npm publish packages/vue --tag next
npm publish packages/testing --tag next
```

Use `latest` only after registry smoke, `urinest.rip` smoke and rollback tag exist.

## Extraction Staging

For now extraction is a planned round, not an in-place source move. The framework moves only after the current app and package gates are green and a registry consumer proves the published packages work.

Target shape:

- Create a separate package directory/repository, for example sibling folder `beslismodel-framework/`.
- Keep the initial package boundaries identical: `core`, `compiler`, `cvrm-prevent`, `vue` and `testing`.
- Copy only framework package source, package tests, package build scripts, release docs and package CI.
- Leave app-owned material in `urinest.rip`: YAML flows, Supabase logging/admin UI, Urinest taxonomy/icons, PWA branding, clinical Dutch copy and app config.
- Preserve public exports exactly on the first move; export changes happen in later minor/major releases.

Local npm setup:

- User-level `.npmrc` stores the Gitea auth token and is never committed.
- Project `.npmrc` may define the scope registry but must not contain a token.
- Package manifests get `publishConfig.registry` only after the local Gitea registry URL is known.
- Prereleases publish with `--tag next`; `latest` waits until registry smoke and app smoke pass.

`urinest.rip` stays runnable during the move:

- The app switches from workspace packages to exact registry versions in one atomic dependency commit.
- Vite and TypeScript aliases to `packages/*/src` are removed or narrowed to app-only code.
- No import path may change to a private package source path; consumers use public `@beslismodel/*` exports only.
- During the transition, source packages and registry packages may be selected only through package manager configuration, not divergent application imports.
- The old package source is removed from the app repository only after the registry-installed app passes `check:packages`, tests, build, budget, PWA smoke, telemetry smoke, landing-grid regression and the Urinestrip end-to-end fixture.

## CI Matrix

Package CI must pass on Node `20`, `22` and `24`.

Required gates:

- `npm ci`
- `npm run build:flows`
- `npm run format:check`
- `npm run lint:all`
- `npm run check`
- `npm run check:tsgo`
- `npm run test`
- `npm run check:packages`
- `npm run build-storybook`
- `npm run build`
- `npm run budget`
- `npm run check:guidelines`
- `npm audit --omit=dev --audit-level=high`
- secret scan and `.env` tracked-file guard

## Registry Smoke

Before moving `urinest.rip` to registry dependencies, create clean temp consumer:

- run local packed-consumer smoke first: pack all framework packages, extract them into a clean
  temp consumer, import only public `@beslismodel/*` exports and run the real Urinestrip
  runner/redirect/result checks plus CVRM SCORE2 calculator/outcome binding;
- fresh `package.json`
- install packages from Gitea registry
- compile minimal manifest runner
- import only public `@beslismodel/*` exports
- run Urinestrip redirect/result fixture

No package-source imports allowed in consumer.

## Urinest Migration

Migration order:

1. Publish prerelease packages to Gitea with `next`.
2. Install exact prerelease versions in `urinest.rip`.
3. Remove app aliases that point to package source.
4. Run `npm run check:packages`, `npm run test`, `npm run check`, `npm run budget`, `npm run build`.
5. Smoke landing grid, questionnaire redirect/back, progress indicator, result page, PWA and telemetry.
6. Promote packages to `latest`.
7. Remove old package source from app repo only after clean registry consumer proof.

## Rollback

Rollback must stay boring:

- Keep previous package versions tagged in Gitea.
- Pin exact registry versions in `package-lock.json`.
- Keep previous working `package-lock.json` in git history.
- Reinstall previous versions and rerun app gates before redeploy.
- Document consumer-impact in release notes: exports, peer ranges, schema changes, migration steps, rollback version.
