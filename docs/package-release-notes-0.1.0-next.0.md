# @beslismodel/* 0.1.0-next.0 Release Notes

Status: prerelease candidate  
Dist-tag: `next`  
Registry: `https://git.oranje.wtf/api/packages/martien/npm/`  
Gitea tag target: `beslismodel-v0.1.0-next.0`

## Package Set

| Package | Root | Public export SHA-256 |
| --- | --- | --- |
| `@beslismodel/core` | `packages/core` | `631b40766686551e61a151579333fa33792301f718bb6665d1cb9ab25f8dde3d` |
| `@beslismodel/compiler` | `packages/compiler` | `86dec7f02c26e94e24527a3b4437b072671c7f3641993f1a76fb4d1c39478423` |
| `@beslismodel/copd-care` | `packages/copd-care` | `e3223bbc9d7121ad44422eeff7bab12748e5afd7929be0017a2b350bf1fd31fe` |
| `@beslismodel/cvrm-prevent` | `packages/cvrm-prevent` | `95bf8837eca6fea1ad58b24d548cda773930dc259e94a3660395cff64e066228` |
| `@beslismodel/dm-care` | `packages/dm-care` | `68d2d4b7afa8cbb39158d1d11b7b109e53471512773f46ddac5ed57b7dbec4a4` |
| `@beslismodel/vue` | `packages/vue` | `a8709639ae43e69fea4df7852815b82330ad0268fc328c7238e1be6aff4809ff` |
| `@beslismodel/testing` | `packages/testing` | `08f3b12d717de559945913654376f362832bd3ed59c5fbc51d290ca97b60e92f` |

## Changed Exports

- `@beslismodel/core`: framework contracts, graph/progress/outcome runtime, calculator registry, calculator bindings, audit trail and verified-calculator validation.
- `@beslismodel/compiler`: YAML/JSON compiler, Vite plugin and CLI.
- `@beslismodel/copd-care`: verified GOLD ABE classifier as `copd.gold_abe`.
- `@beslismodel/cvrm-prevent`: verified SCORE2/SCORE2-OP/SCORE2-Diabetes calculator as `cvrm.score2`.
- `@beslismodel/dm-care`: verified HbA1c IFCC/NGSP/eAG converter as `dm.hba1c_conversion`.
- `@beslismodel/vue`: Pinia store factory, route guards, runner/resolver composables, landing menu and telemetry adapter contracts.
- `@beslismodel/testing`: manifest snapshots, clinical safety fixtures and role/context matrix helpers.

## Consumer Impact

- Consumers import only public `@beslismodel/*` package roots.
- No consumer may import `packages/*/src` private source paths.
- Internal package dependencies pin exact version `0.1.0-next.0`.
- Node engine: `>=20.19.0`.
- Tarballs contain only `dist/` and `package.json`.
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
BESLISMODEL_PUBLISH_CONFIRM=0.1.0-next.0 npm run check:package-publish-next -- --publish
```

Registry smoke after publish:

```bash
BESLISMODEL_REGISTRY_SMOKE_VERSION=0.1.0-next.0 npm run check:package-registry-smoke
```

## Migration

1. Publish all seven packages with dist-tag `next`.
2. Run registry smoke with exact version `0.1.0-next.0`.
3. Switch `urinest.rip` dependencies to exact registry versions.
4. Remove or narrow Vite/TypeScript package-source aliases.
5. Run app gates: `check:app`, `check:framework`, `test`, `build`, bundle budgets, landing-grid regression, questionnaire-switch regression and Urinestrip consumer fixture.
6. Promote to `latest` only after app and registry smokes pass.

## Rollback

- Keep previous exact package versions in `package-lock.json`.
- Keep Gitea tag `beslismodel-v0.1.0-next.0` tied to this release note.
- Reinstall previous exact package versions if registry smoke or app smoke fails.
- Rerun `npm run check:app`, `npm run check:framework`, `npm run test`, `npm run build`.

## Source Traceability

- `@beslismodel/cvrm-prevent`: SCORE2 implementation carries formula version, source references and test vectors.
- `@beslismodel/dm-care`: HbA1c converter carries NGSP/IFCC source reference and test vectors.
- `@beslismodel/copd-care`: GOLD ABE classifier carries GOLD 2026 source references and test vectors.
- Flow guideline source traceability stays in consumer flow manifests and app guideline checks.
