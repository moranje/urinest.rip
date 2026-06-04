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

Current status: `beslismodel-framework` exists on Gitea and the first-push repository creation path
is complete. Earlier verification saw `master` at `f177fa4308a71c7a802212d986b7eeee370d9ecb`;
later package-hardening work advanced the repo through `e296808`. NAS must re-check current
remote state before publishing.

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
- `@oranje/tokens` and `@xenia/ui` publish after `npm view <package>@<version>` and skip when the
  exact version already exists.
- Some scoped publish flows pass `GITEA_NPM_TOKEN=${{ secrets.NPM_REGISTRY_TOKEN }}` because
  project `.npmrc` expands `_authToken=${GITEA_NPM_TOKEN}`.
- `@oranje/telemetry` uses the same publish-then-finalize release shape: npm publish first, then
  tag/release creation.

For framework package publishing, local scripts rely on npm's own auth lookup. They verify auth
with `npm whoami --registry https://git.oranje.wtf/api/packages/martien/npm/` when supported. If
Gitea returns `404` for npm's `/-/whoami` endpoint, the script falls back to Gitea's `/api/v1/user`
using `NODE_AUTH_TOKEN`, `NPM_TOKEN`, `NPM_REGISTRY_TOKEN`, `GITEA_NPM_TOKEN`, or user-level npm
auth. `check:package-publish-next -- --publish` follows the sibling package pattern: all versions
already present means skip-and-continue, a partial existing set fails hard. Do not create
project-local npm auth files. During publish the script writes a temporary npm userconfig inside
the publish cache so env tokens such as `GITEA_NPM_TOKEN` reach `npm publish`; that file is removed
after the command.

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
BESLISMODEL_PUBLISH_CONFIRM=<exact-prerelease> npm run check:package-publish-next -- --publish
```

Publish a stable release with dist-tag `latest` only after registry smoke and `urinest.rip` app
smoke pass:

```bash
BESLISMODEL_PUBLISH_TAG=latest BESLISMODEL_PUBLISH_CONFIRM=0.1.0 \
  npm run check:package-publish-next -- --publish
```

The publish command first dry-runs every package, infers `next` for prereleases and `latest` for
stable versions during dry-run checks, verifies registry auth for real publish, and checks that none
of the package versions already exist in Gitea before the first `npm publish` call. A real stable
publish still requires explicit `BESLISMODEL_PUBLISH_TAG=latest`.

In the standalone Gitea repo, `.gitea/workflows/publish-next.yaml` exposes the same path as manual
`workflow_dispatch`. It requires `NPM_REGISTRY_TOKEN` and `RELEASE_TOKEN`, runs
`npm run check:packages` with the dispatched `dist_tag`, publishes with
`BESLISMODEL_PUBLISH_CONFIRM` and `BESLISMODEL_PUBLISH_TAG`, immediately runs registry smoke for the
dispatched version, then creates `beslismodel-v<version>` from the matching package release-notes
file.

The publish step is rerunnable after a post-publish smoke/tag failure: if all package versions already
exist, publish is skipped and the workflow continues. A partial existing package set still fails.

Smoke installed packages from Gitea:

```bash
BESLISMODEL_REGISTRY_SMOKE_VERSION=<exact-prerelease> npm run check:package-registry-smoke
```

Registry smoke accepts the exact package version, either prerelease (`0.1.0-next.1`) or stable
(`0.1.0`), so the same post-publish smoke works for both `next` and `latest` releases. Use
`--check-version` for a no-install version gate when the registry itself is temporarily unavailable.

For CI or NAS verification against the package version currently declared in all framework package
manifests:

```bash
npm run check:package-registry-smoke:current
```

If local registry access requires the proxy:

```bash
BESLISMODEL_REGISTRY_URL=https://git.oranje.wtf:8766/api/packages/martien/npm/ \
BESLISMODEL_REGISTRY_SMOKE_VERSION=<exact-prerelease> \
npm run check:package-registry-smoke
```

Prepare `urinest.rip` as a registry consumer only after publish and smoke pass:

```bash
BESLISMODEL_REGISTRY_MIGRATION_VERSION=<exact-version> npm run migrate:registry-deps -- --write
npm install
npm run check:app
npm run check:browser-smoke
```

Current registry status: `0.1.0-next.1` is published with dist-tag `next`; `0.1.0` is published
with dist-tag `latest`; `urinest.rip` consumes exact `@beslismodel/*@0.1.0` registry packages.
Post-migration verification passed with `check:package-registry-smoke:current`, `check:packages`,
`check:app`, `check:browser-smoke`, `check:lighthouse` and production `npm audit`.

`migrate:registry-deps -- --write` verifies every exact `@beslismodel/*` version against the Gitea
npm registry before changing app config. Use `--skip-registry-check` only in isolated tests.

The publish guard rejects prerelease versions for `latest` and stable versions for `next`.
