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
git init -b master
git remote add origin ssh://git@192.168.1.170:2223/martien/beslismodel-framework.git
git push -u origin master
```

The Gitea server creates this repository on first push. `git ls-remote` may return "not found"
before the first push and must not be treated as a blocking preflight.

Current status: `beslismodel-framework` exists on Gitea and `master` was verified at
`f177fa4308a71c7a802212d986b7eeee370d9ecb`. The first-push repository creation path is complete.

## Registry

Canonical npm registry:

```text
https://git.oranje.wtf/api/packages/martien/npm/
```

Project-level `.npmrc.example` may contain only scope routing:

```text
@beslismodel:registry=https://git.oranje.wtf/api/packages/martien/npm/
```

User-level `~/.npmrc` provides auth:

```text
<canonical-registry-auth-line-with-token>
```

Do not commit auth material. Prior audits in `labbie` and `patient-tracker` marked tracked npm
tokens as critical supply-chain findings. Do not copy the older tracked-token pattern.

## Token Names

Patterns found in sibling repos:

- `NPM_REGISTRY_TOKEN`: Gitea Actions build/deploy token passed to baseline actions.
- `GITEA_NPM_TOKEN`: Renovate/private registry token name.

For framework package publishing, local scripts rely on npm's own auth lookup. They verify auth
with `npm whoami --registry https://git.oranje.wtf/api/packages/martien/npm/` when supported. If
Gitea returns `404` for npm's `/-/whoami` endpoint, the script falls back to Gitea's `/api/v1/user`
using `NODE_AUTH_TOKEN`, `NPM_TOKEN`, `NPM_REGISTRY_TOKEN`, `GITEA_NPM_TOKEN`, or user-level npm
auth. Do not create project-local npm auth files.

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

The publish command first dry-runs every package, verifies registry auth, and checks that none of
the package versions already exist in Gitea before the first `npm publish` call.

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
