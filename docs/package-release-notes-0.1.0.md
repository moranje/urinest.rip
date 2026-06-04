# @beslismodel/* 0.1.0 Release Notes

Status: stable release  
Dist-tag: `latest`  
Registry: `https://git.oranje.wtf/api/packages/martien/npm/`  
Gitea tag target: `beslismodel-v0.1.0`

## Package Set

| Package | Root | Public export SHA-256 | Source files | Source tree SHA-256 |
| --- | --- | --- | ---: | --- |
| `@beslismodel/core` | `packages/core` | `631b40766686551e61a151579333fa33792301f718bb6665d1cb9ab25f8dde3d` | 30 | `39721144b2498c811b37891550f046dc6720d2bcb7b339b3123cbf9ae67cbe21` |
| `@beslismodel/compiler` | `packages/compiler` | `86dec7f02c26e94e24527a3b4437b072671c7f3641993f1a76fb4d1c39478423` | 10 | `f48718d92cbab0e2e062c614c32c41cfddb71f8fe73f95a3aceec609bd40de94` |
| `@beslismodel/copd-care` | `packages/copd-care` | `e3223bbc9d7121ad44422eeff7bab12748e5afd7929be0017a2b350bf1fd31fe` | 10 | `30420710d6d77d609134ff1b7627e2ce391ea6e13f4e900b0f19cf96334cec49` |
| `@beslismodel/cvrm-prevent` | `packages/cvrm-prevent` | `724ca45016dbe9330c486a6ff7fbe8e1d98cef136688776b7ba8f3f90dab5cf3` | 12 | `0bd6b1d29e20f90556c6e239b6cdc31e94a636e57e020b667c07969b9f61d302` |
| `@beslismodel/dm-care` | `packages/dm-care` | `68d2d4b7afa8cbb39158d1d11b7b109e53471512773f46ddac5ed57b7dbec4a4` | 10 | `2c384b91d81f0662b650ffbfde871f0384205ca962f5ffd4f78fe44e3fefc9bb` |
| `@beslismodel/vue` | `packages/vue` | `a8709639ae43e69fea4df7852815b82330ad0268fc328c7238e1be6aff4809ff` | 17 | `fcaa03e2f5ccd550ade3718f87350c4c14b0810cb62fe56c9643623c3ea422dd` |
| `@beslismodel/testing` | `packages/testing` | `f99ce3b57278d9f74ea4dfcffaa8d6309efd558f44edf0ccec892cceb956dd31` | 5 | `337291f27c891edd4efd4bf2709ff07e8e751ca8d7d8d4f7c14fae6ddb5cc3ab` |

## Changed Exports

- `@beslismodel/core`: framework contracts, graph/progress/outcome runtime, calculator registry, calculator bindings, audit trail and verified-calculator validation.
- `@beslismodel/compiler`: YAML/JSON compiler, Vite plugin and CLI.
- `@beslismodel/copd-care`: verified GOLD ABE classifier as `copd.gold_abe`.
- `@beslismodel/cvrm-prevent`: verified SCORE2/SCORE2-OP/SCORE2-Diabetes calculator as `cvrm.score2` and AHA PREVENT 10-/30-year CVD/ASCVD/HF/CHD/stroke calculator as `cvrm.prevent`.
- `@beslismodel/dm-care`: verified HbA1c IFCC/NGSP/eAG converter as `dm.hba1c_conversion`.
- `@beslismodel/vue`: Pinia store factory, route guards, runner/resolver composables, landing menu and telemetry adapter contracts.
- `@beslismodel/testing`: manifest snapshots, clinical safety fixtures, role/context matrix helpers and guideline traceability/option-defense helpers.

## Consumer Impact

This stable release carries the Vue store persistence hardening, publish/registry guard updates and reusable guideline traceability helpers from the post-0.1.0-next.0 framework sync.


- Consumers import only public `@beslismodel/*` package roots.
- No consumer may import `packages/*/src` private source paths.
- Internal package dependencies pin exact version `0.1.0`.
- Node engine: `>=20.19.0`.
- Tarballs contain only `dist/` and `package.json`.
- Consumers can use `@beslismodel/testing` to verify per-flow option defenses through
  `optionDefenseRequiredForFlows` and `optionClaims`.
- Clinical flow data remains consumer-owned; framework packages do not bundle Urinest YAML flows, Supabase app logging, app icons or PWA branding.

## Verification

Run before Gitea tag:

```bash
npm run check:framework
npm run check
npm run check:tsgo
npm run lint:all
npm run test
npm run build
npm run budget:packages
npm run check:package-release-notes
```

Registry publish dry-run:

```bash
npm run check:package-publish-next
```

Registry publish:

```bash
BESLISMODEL_PUBLISH_TAG=latest BESLISMODEL_PUBLISH_CONFIRM=0.1.0 npm run check:package-publish-next -- --publish
```

Registry smoke after publish:

```bash
BESLISMODEL_REGISTRY_SMOKE_VERSION=0.1.0 npm run check:package-registry-smoke
```

## Migration

1. Publish all seven packages with dist-tag `latest`.
2. Run registry smoke with exact version `0.1.0`.
3. Switch `urinest.rip` dependencies to exact registry versions.
4. Remove or narrow Vite/TypeScript package-source aliases.
5. Run app gates: `check:app`, `check:framework`, `test`, `build`, bundle budgets, landing-grid regression, questionnaire-switch regression and Urinestrip consumer fixture.
6. Keep `latest` only after app and registry smokes pass.

## Rollback

- Keep previous exact package versions in `package-lock.json`.
- Keep Gitea tag `beslismodel-v0.1.0` tied to this release note.
- Reinstall previous exact package versions if registry smoke or app smoke fails.
- Rerun `npm run check:app`, `npm run check:framework`, `npm run test`, `npm run build`.

## Source Traceability

- `@beslismodel/cvrm-prevent`: SCORE2 and AHA PREVENT implementations carry formula versions, source references and test vectors.
- `@beslismodel/dm-care`: HbA1c converter carries NGSP/IFCC source reference and test vectors.
- `@beslismodel/copd-care`: GOLD ABE classifier carries GOLD 2026 source references and test vectors.
- Flow guideline source traceability stays in consumer flow manifests and app guideline checks.
