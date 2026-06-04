# Design Token Distribution

`src/styles/tokens.css` blijft runtime source-of-truth. `npm run check:design-tokens`
genereert en controleert de DTCG-compatible export in `src/styles/beslismodel.tokens.json`
en de first-paint theme metadata in `public/theme-tokens.js`.

`npm run check:design-token-distribution` controleert dat dezelfde token-export geschikt blijft
voor externe design-tool distributie en consumer pipelines.

## Targets

| Target | Input | Status | Gebruik |
| --- | --- | --- | --- |
| `style-dictionary-v4` | `src/styles/beslismodel.tokens.json` | ready | Style Dictionary v4 kan de DTCG `$type`/`$value` token graph gebruiken voor native/web transforms. |
| `tokens-studio-figma` | `src/styles/beslismodel.tokens.json` | ready | Tokens Studio/Figma-import met referenties, light/dark tokenmetadata en CSS-source extensions. |
| `web-runtime-css` | `src/styles/tokens.css` | ready | App runtime CSS custom properties, `light-dark()`, forced-colors en contrast modes. |
| `theme-bootstrap` | `public/theme-tokens.js` | ready | Statische theme-color en first-paint bootstrap metadata. |

## Governance

- Source-of-truth blijft `src/styles/tokens.css`.
- `src/styles/beslismodel.tokens.json` is generated parity artefact, geen handmatig bestand.
- `docs/design-token-distribution.json` is generated distributie-manifest en wordt door CI
  gecontroleerd.
- Custom MD3-extensies zijn expliciet: warning kleuren en positive-indicator kleuren.
- Nieuwe component tokens moeten eerst in CSS source staan, daarna via `tokens:write` en
  `tokens:distribution:write` in de distributie komen.

## Commands

```bash
npm run tokens:write
npm run tokens:distribution:write
npm run check:design-tokens
npm run check:design-token-distribution
```
