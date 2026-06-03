# Gitea Package Publishing

This document pins the local Gitea/npm pattern observed in `abacus`, `patient-tracker`,
`werkoverleg` and `labbie`, adapted for `@beslismodel/*`.

## Repository Remote

Existing local projects use SSH remotes:

```bash
ssh://git@192.168.1.170:2223/martien/<repo>.git
```

For the extracted framework repository:

```bash
git remote add origin ssh://git@192.168.1.170:2223/martien/beslismodel-framework.git
git push -u origin master
```

The Gitea repository must exist first unless server-side repo creation on push is enabled.

## Registry

Canonical npm registry:

```text
https://git.oranje.wtf/api/packages/martien/npm/
```

Project-level `.npmrc.example` may contain only scope routing:

```text
@beslismodel:registry=https://git.oranje.wtf/api/packages/martien/npm/
```

User-level `~/.npmrc` or CI secrets provide auth:

```text
//git.oranje.wtf/api/packages/martien/npm/:_authToken=<token>
```

Do not commit auth material. Prior audits in `labbie` and `patient-tracker` marked tracked npm
tokens as critical supply-chain findings. Do not copy the older tracked-token pattern.

## Token Names

Patterns found in sibling repos:

- `NPM_REGISTRY_TOKEN`: Gitea Actions build/deploy token passed to baseline actions.
- `GITEA_NPM_TOKEN`: Renovate/private registry token name.

For framework package publishing, local scripts rely on npm's own auth lookup. Keep the token in
user-level npm config or inject it into the process environment before publish.

## Baseline Actions

Use baseline actions for app lifecycle work, not as an abstraction over package publishing:

- PR/app CI: `baseline/actions/setup-npm-auth` and `baseline/actions/setup-node`.
- Gitea release PR: `baseline/actions/release-pr`.
- App sourcemaps: `baseline/actions/upload-sourcemaps`.
- Gitea release tag/entry: `baseline/actions/release-finalize`.

Do not use baseline actions for the `@beslismodel/*` publish itself. Package publishing stays
explicit through `npm publish`, guarded by `npm run check:package-publish-next` and registry smoke.

## Local Proxy

`labbie` has a local-only proxy helper for environments where local access goes through
`git.oranje.wtf:8766` while CI uses standard HTTPS. Keep lockfiles and package manifests on the
canonical URL. Use `BESLISMODEL_REGISTRY_URL` only for registry smoke when local npm must resolve
through a proxy.

## Publish Flow

Dry-run first:

```bash
npm run check:framework
npm run check:package-publish-next
```

Publish the prerelease with dist-tag `next`:

```bash
BESLISMODEL_PUBLISH_CONFIRM=0.1.0-next.0 npm run check:package-publish-next -- --publish
```

Smoke installed packages from Gitea:

```bash
BESLISMODEL_REGISTRY_SMOKE_VERSION=0.1.0-next.0 npm run check:package-registry-smoke
```

If local registry access requires the proxy:

```bash
BESLISMODEL_REGISTRY_URL=https://git.oranje.wtf:8766/api/packages/martien/npm/ \
BESLISMODEL_REGISTRY_SMOKE_VERSION=0.1.0-next.0 \
npm run check:package-registry-smoke
```

Promote to `latest` only after registry smoke and `urinest.rip` app smoke pass.
