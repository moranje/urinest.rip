import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const tokenJsonPath = "src/styles/beslismodel.tokens.json";
const tokenCssPath = "src/styles/tokens.css";
const themeScriptPath = "public/theme-tokens.js";
const manifestPath = "docs/design-token-distribution.json";
const distributionDocPath = "docs/design-token-distribution.md";
const extensionKey = "wtf.oranje.beslismodel";
const isWrite = process.argv.includes("--write");

const supportedTokenTypes = new Set([
  "color",
  "cubicBezier",
  "dimension",
  "duration",
  "fontFamily",
  "number",
  "typography",
]);

function fail(message) {
  throw new Error(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), "utf8"));
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectTokens(node, path = [], tokens = []) {
  if (!isRecord(node)) return tokens;
  if (typeof node.$type === "string") {
    tokens.push({ node, path: path.join(".") });
    return tokens;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    collectTokens(value, [...path, key], tokens);
  }
  return tokens;
}

function countByType(tokens) {
  return tokens.reduce((counts, token) => {
    counts[token.node.$type] = (counts[token.node.$type] ?? 0) + 1;
    return counts;
  }, {});
}

function assertDtcgCompatibility(tokenExport, tokens) {
  const extension = tokenExport.$extensions?.[extensionKey];
  if (!extension) fail(`Token export must include $extensions.${extensionKey}`);
  if (extension.source !== tokenCssPath) fail(`Token export source must be ${tokenCssPath}`);
  if (!extension.specification?.includes("designtokens.org/TR/2025.10")) {
    fail("Token export must reference the current DTCG format specification.");
  }
  if (!extension.theme?.themeColor?.light || !extension.theme?.themeColor?.dark) {
    fail("Token export must expose generated light/dark theme metadata.");
  }

  for (const token of tokens) {
    if (!supportedTokenTypes.has(token.node.$type)) {
      fail(`${token.path}: unsupported token type ${token.node.$type}`);
    }
    if (token.node.$value === undefined) fail(`${token.path}: missing $value`);
    const tokenExtension = token.node.$extensions?.[extensionKey];
    if (!tokenExtension?.cssName || !tokenExtension?.cssValue) {
      fail(`${token.path}: missing source cssName/cssValue extension`);
    }
  }
}

function buildManifest() {
  const tokenExport = readJson(tokenJsonPath);
  const tokens = collectTokens(tokenExport);
  const counts = countByType(tokens);
  assertDtcgCompatibility(tokenExport, tokens);

  if ((counts.color ?? 0) < 40) fail("Token distribution must include color tokens.");
  if ((counts.dimension ?? 0) < 10) fail("Token distribution must include dimension tokens.");
  if ((counts.typography ?? 0) < 10) fail("Token distribution must include typography tokens.");

  return {
    $schema: "https://www.designtokens.org/TR/2025.10/format/",
    name: "beslismodel-design-token-distribution",
    generatedBy: "scripts/check-design-token-distribution.mjs",
    source: {
      css: tokenCssPath,
      dtcg: tokenJsonPath,
      themeBootstrap: themeScriptPath,
    },
    targets: [
      {
        id: "style-dictionary-v4",
        input: tokenJsonPath,
        compatibility: "DTCG $type/$value token graph with CSS source extensions",
        status: "ready",
      },
      {
        id: "tokens-studio-figma",
        input: tokenJsonPath,
        compatibility: "DTCG-compatible import with references and theme metadata",
        status: "ready",
      },
      {
        id: "web-runtime-css",
        input: tokenCssPath,
        compatibility: "CSS custom properties, light-dark(), forced-colors and contrast modes",
        status: "ready",
      },
      {
        id: "theme-bootstrap",
        input: themeScriptPath,
        compatibility: "Static app metadata for theme-color and first-paint theme bootstrap",
        status: "ready",
      },
    ],
    governance: {
      sourceOfTruth: tokenCssPath,
      parityChecks: ["npm run check:design-tokens", "npm run check:design-token-distribution"],
      customMd3Extensions: [
        "md.sys.color.warning",
        "md.sys.color.on.warning",
        "md.sys.color.warning.container",
        "md.sys.color.on.warning.container",
        "md.sys.color.indicator.positive",
      ],
    },
    counts: {
      total: tokens.length,
      byType: Object.fromEntries(
        Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
      ),
    },
  };
}

function formatManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2).replace(
    /"parityChecks": \[\n {6}"npm run check:design-tokens",\n {6}"npm run check:design-token-distribution"\n {4}\]/u,
    '"parityChecks": ["npm run check:design-tokens", "npm run check:design-token-distribution"]',
  )}\n`;
}

const generated = formatManifest(buildManifest());

if (isWrite) {
  writeFileSync(resolve(manifestPath), generated);
  console.log(`Wrote ${manifestPath}`);
} else {
  const current = readFileSync(resolve(manifestPath), "utf8");
  if (current !== generated) {
    fail(`${manifestPath} is out of sync. Run: npm run tokens:distribution:write`);
  }
  const doc = readFileSync(resolve(distributionDocPath), "utf8");
  for (const required of [
    "style-dictionary-v4",
    "tokens-studio-figma",
    "web-runtime-css",
    "theme-bootstrap",
    "npm run check:design-token-distribution",
  ]) {
    if (!doc.includes(required)) fail(`${distributionDocPath} must document ${required}`);
  }
  console.log("Design token distribution manifest is in sync");
}
