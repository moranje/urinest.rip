# urinest.rip — Beslishulp urineonderzoek

## Project

Vue 3 + Vite SPA voor huisartsen. Klinische beslisbomen in YAML (`flows/`), gecompileerd door de lokale beslismodel compiler naar `public/main.json`.

## Tech stack

- Vue 3, Vue Router, Pinia
- TypeScript 6, TypeScript Go native preview (`tsgo`), Vite 8/Rolldown
- `@beslismodel/*` packages: core runtime, compiler, Vue runtime en testing utilities
- Supabase (auth + structured logging)
- PWA (vite-plugin-pwa)

## Commands

- `npm run dev` — lokale dev server
- `npm run build` — productie build
- `npm run check` — vue-tsc type-check
- `npm run check:tsgo` — TypeScript Go/native preview check voor TS-only lagen
- `npm run check:guidelines` — valideert richtlijntraceerbaarheid voor alle UI-flowstappen
- `npm run lint` — oxlint
- `npm run lint:eslint` — eslint (security rules)
- `npm run lint:all` — oxlint + eslint
- `npm run test` — vitest

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):

1. **CI**: lint + type-check + test (parallel), npm audit, secret scanning
2. **Deploy**: conventional changelog, semver bump, Netlify deploy, GitHub Release

Netlify auto-builds zijn uitgeschakeld; deploy gaat uitsluitend via GitHub Actions.

## Conventions

### Commits

Conventional commits (commitlint). Types: feat, fix, docs, chore, ci, refactor, test.

### Richtlijn review-datums

Bij inhoudelijke wijzigingen aan flows MOET de `reviewed` datum in `src/views/AboutPage.vue` gecontroleerd en bijgewerkt worden voor de betreffende richtlijn(en). De build-datum (`__BUILD_DATE__`) wordt automatisch ingevuld door Vite.
Elke zichtbare vraag, antwoordset, resultaatkaart en redirect moet ook in `docs/guideline-traceability.json` onderbouwd zijn. Draai na flowwijzigingen `npm run build` en `npm run check:guidelines`.

### Flows

YAML bestanden in `flows/`. Elke flow heeft: id, version, title, description, questions, steps, results, resultsLogic. Validatie vindt plaats tijdens build via de beslismodel compiler.

### Rollen

De app kent twee rollen (toggle in header):

- **Behandelaar** (arts/verpleegkundige): behandelopties, doseringen, documentatie
- **Triage** (triagist/doktersassistent): vervolgonderzoek, verwijscriteria

### Environment variables

`VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` worden als GitHub secrets doorgegeven aan de build step. Lokaal via `.env`.

### Design tokens

Kleur-tokens gebruiken `light-dark(light, dark)` in `src/styles/tokens.css` met `@supports` fallback voor oudere browsers. `data-theme` zet uitsluitend `color-scheme`; alle primitieve en semantische kleurrollen blijven in `tokens.css`.
