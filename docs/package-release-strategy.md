# Beslismodel Package Release Strategy

Purpose: publish `@beslismodel/*` as standalone framework packages while keeping `urinest.rip` working as first consumer.

## Package Set

Initial lockstep set:

- `@beslismodel/core`
- `@beslismodel/compiler`
- `@beslismodel/vue`
- `@beslismodel/testing`

All four packages use same version until external consumers prove independent release lanes are needed. Internal dependencies must pin same framework version, for example `@beslismodel/vue -> @beslismodel/core`.

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
npm publish packages/vue --tag next
npm publish packages/testing --tag next
```

Use `latest` only after registry smoke, `urinest.rip` smoke and rollback tag exist.

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
