import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { inspect } from "node:util";

const tokenCssPath = "src/styles/tokens.css";
const tokenJsonPath = "src/styles/beslismodel.tokens.json";
const themeScriptPath = "public/theme-tokens.js";
const sourceUrl = "https://www.designtokens.org/TR/2025.10/format/";
const extensionKey = "wtf.oranje.beslismodel";
const isWrite = process.argv.includes("--write");

const fail = (message) => {
  throw new Error(message);
};

const normalizeCssValue = (value) => value.replace(/\s+/gu, " ").trim();

const cssVarToPath = (name) => name.replace(/^--/u, "").split("-");
const aliasForCssVar = (value) => {
  const match = value.match(/^var\((--[\w-]+)\)$/u);
  if (!match) return null;
  return `{${cssVarToPath(match[1]).join(".")}}`;
};

function setPath(target, path, value) {
  let cursor = target;
  for (const segment of path.slice(0, -1)) {
    cursor[segment] ??= {};
    cursor = cursor[segment];
  }
  cursor[path.at(-1)] = value;
}

function getPath(target, path) {
  return path.reduce((cursor, segment) => cursor?.[segment], target);
}

function extractRootBlock(css) {
  const start = css.indexOf(":root {");
  const end = css.indexOf("\n}\n\n[data-theme", start);
  if (start === -1 || end === -1) fail("Could not locate primary :root token block");
  return css.slice(start, end);
}

function extractDeclarations(css) {
  const rootBlock = extractRootBlock(css);
  const matches = [...rootBlock.matchAll(/--[\w-]+\s*:/gu)];
  return matches.map((match) => {
    const name = match[0].replace(/\s*:\s*$/u, "");
    const valueStart = match.index + match[0].length;
    const valueEnd = rootBlock.indexOf(";", valueStart);
    if (valueEnd === -1) fail(`Missing semicolon for token ${name}`);
    return [name, normalizeCssValue(rootBlock.slice(valueStart, valueEnd))];
  });
}

function splitTopLevelComma(value) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts;
}

function parseLightDark(value) {
  const match = value.match(/^light-dark\((.*)\)$/u);
  if (!match) return null;
  const parts = splitTopLevelComma(match[1]);
  if (parts.length !== 2) fail(`Expected light-dark(light, dark), got ${value}`);
  return { light: parts[0], dark: parts[1] };
}

function parseHexColor(value) {
  const match = value.match(/^#(?<hex>[0-9a-fA-F]{6})$/u);
  if (!match) return null;
  const hex = match.groups.hex.toLowerCase();
  const components = [0, 2, 4].map((index) =>
    Number((Number.parseInt(hex.slice(index, index + 2), 16) / 255).toFixed(4)),
  );
  return { colorSpace: "srgb", components, hex: `#${hex}` };
}

function parseRgbaColor(value) {
  const match = value.match(
    /^rgba\((?<r>\d+), (?<g>\d+), (?<b>\d+), (?<a>0(?:\.\d+)?|1(?:\.0+)?)\)$/u,
  );
  if (!match) return null;
  const { a, b, g, r } = match.groups;
  return {
    alpha: Number(a),
    colorSpace: "srgb",
    components: [r, g, b].map((item) => Number((Number(item) / 255).toFixed(4))),
  };
}

function parseDimension(value) {
  const match = value.match(/^(?<value>-?\d+(?:\.\d+)?)(?<unit>px|rem)$/u);
  if (!match) return null;
  return { unit: match.groups.unit, value: Number(match.groups.value) };
}

function parseDuration(value) {
  const match = value.match(/^(?<value>\d+(?:\.\d+)?)(?<unit>ms|s)$/u);
  if (!match) return null;
  return { unit: match.groups.unit, value: Number(match.groups.value) };
}

function parseCubicBezier(value) {
  const match = value.match(/^cubic-bezier\((?<values>[^)]+)\)$/u);
  if (!match) return null;
  return match.groups.values.split(",").map((item) => Number(item.trim()));
}

function parseNumber(value) {
  if (!/^-?\d+(?:\.\d+)?$/u.test(value)) return null;
  return Number(value);
}

function parseTypography(value) {
  const match = value.match(
    /^(?<weight>\d+)\s+(?<size>\d+(?:\.\d+)?rem)\/(?<lineHeight>\d+(?:\.\d+)?)\s+var\((?<family>--[\w-]+)\)$/u,
  );
  if (!match) return null;
  const size = parseDimension(match.groups.size);
  const family = aliasForCssVar(`var(${match.groups.family})`);
  if (!size || !family) return null;
  return {
    fontFamily: family,
    fontSize: size,
    fontWeight: Number(match.groups.weight),
    lineHeight: Number(match.groups.lineHeight),
  };
}

function token(type, value, cssName, cssValue, description) {
  return {
    $description: description,
    $extensions: {
      [extensionKey]: {
        cssName,
        cssValue,
      },
    },
    $type: type,
    $value: value,
  };
}

function resolveTokenReference(output, reference) {
  const match = reference.match(/^\{(?<path>[\w.]+)\}$/u);
  if (!match) fail(`Expected token reference, got ${reference}`);
  const node = getPath(output, match.groups.path.split("."));
  if (!node) fail(`Could not resolve token reference ${reference}`);
  if (node.$value?.hex) return node.$value.hex;
  if (typeof node.$value === "string") return resolveTokenReference(output, node.$value);
  fail(`Token reference ${reference} does not resolve to a hex color`);
}

function addThemeMetadata(output) {
  const theme = {
    backgroundColor: {
      dark: resolveTokenReference(output, "{md.sys.color.background.dark}"),
      light: resolveTokenReference(output, "{md.sys.color.background.light}"),
    },
    themeColor: {
      dark: resolveTokenReference(output, "{md.sys.color.primary.container.dark}"),
      light: resolveTokenReference(output, "{md.sys.color.primary.light}"),
    },
  };
  output.$extensions[extensionKey].theme = theme;
  return theme;
}

function buildThemeScript(theme) {
  return [
    "window.__BESLISMODEL_THEME_TOKENS__ = Object.freeze({",
    "  backgroundColor: {",
    `    dark: "${theme.backgroundColor.dark}",`,
    `    light: "${theme.backgroundColor.light}",`,
    "  },",
    "  themeColor: {",
    `    dark: "${theme.themeColor.dark}",`,
    `    light: "${theme.themeColor.light}",`,
    "  },",
    "});",
    "",
  ].join("\n");
}

function stringifyTokenExport(output) {
  return `${JSON.stringify(output, null, 2).replace(
    /\[\n(?<body>(?:\s+-?\d+(?:\.\d+)?(?:,)?\n)+)\s+\]/gu,
    (_match, body) => {
      const values = body
        .trim()
        .split(/\s*,?\n\s*/u)
        .filter(Boolean)
        .map((value) => value.replace(/,$/u, ""));
      return `[${values.join(", ")}]`;
    },
  )}\n`;
}

function assertStaticThemeMetadata(theme) {
  const index = readFileSync(resolve("index.html"), "utf8");
  const expectedLight = `content="${theme.themeColor.light}" media="(prefers-color-scheme: light)"`;
  const expectedDark = `content="${theme.themeColor.dark}" media="(prefers-color-scheme: dark)"`;
  if (!index.includes('src="/theme-tokens.js"')) {
    fail("index.html must load /theme-tokens.js before /theme-init.js");
  }
  if (!index.includes(expectedLight)) {
    fail(`index.html light theme-color meta must match generated tokens: ${expectedLight}`);
  }
  if (!index.includes(expectedDark)) {
    fail(`index.html dark theme-color meta must match generated tokens: ${expectedDark}`);
  }
}

function addParsedToken(output, name, value) {
  const path = cssVarToPath(name);
  const color = parseHexColor(value) ?? parseRgbaColor(value);
  if (name.startsWith("--md-ref-palette-") && color) {
    setPath(output, path, token("color", color, name, value, "Reference palette color token."));
    return true;
  }

  const lightDark = parseLightDark(value);
  if (name.startsWith("--md-sys-color-") && lightDark) {
    const light = aliasForCssVar(lightDark.light);
    const dark = aliasForCssVar(lightDark.dark);
    if (!light || !dark) fail(`${name}: light-dark modes must reference palette tokens`);
    const groupPath = path;
    setPath(
      output,
      [...groupPath, "$description"],
      "Semantic color role with light and dark modes.",
    );
    setPath(output, [...groupPath, "$extensions"], {
      [extensionKey]: {
        cssName: name,
        cssValue: value,
      },
    });
    setPath(
      output,
      [...groupPath, "light"],
      token("color", light, name, lightDark.light, "Light theme color value."),
    );
    setPath(
      output,
      [...groupPath, "dark"],
      token("color", dark, name, lightDark.dark, "Dark theme color value."),
    );
    return true;
  }

  const dimension = parseDimension(value);
  if (
    dimension &&
    (/^--md-sys-shape-corner-/u.test(name) ||
      /^--spacing-/u.test(name) ||
      /^--layout-/u.test(name) ||
      /^--min-touch-target$/u.test(name) ||
      /^--bp-/u.test(name))
  ) {
    setPath(output, path, token("dimension", dimension, name, value, "Runtime dimension token."));
    return true;
  }

  const duration = parseDuration(value);
  if (duration && /^--motion-duration-/u.test(name)) {
    setPath(output, path, token("duration", duration, name, value, "Motion duration token."));
    return true;
  }

  const cubicBezier = parseCubicBezier(value);
  if (cubicBezier && /^--motion-easing-/u.test(name)) {
    setPath(output, path, token("cubicBezier", cubicBezier, name, value, "Motion easing token."));
    return true;
  }

  const number = parseNumber(value);
  if (
    number !== null &&
    (/^--z-/u.test(name) ||
      /^--md-sys-state-/u.test(name) ||
      /^--md-ref-typeface-weight-/u.test(name))
  ) {
    setPath(output, path, token("number", number, name, value, "Numeric runtime token."));
    return true;
  }

  const typography = parseTypography(value);
  if (typography && /^--md-sys-typescale-/u.test(name)) {
    setPath(output, path, token("typography", typography, name, value, "Typography scale token."));
    return true;
  }

  if (/^--md-ref-typeface-(brand|plain)$/u.test(name)) {
    setPath(output, path, token("fontFamily", value, name, value, "Typeface family token."));
    return true;
  }

  return false;
}

function buildDtcgExport() {
  const css = readFileSync(resolve(tokenCssPath), "utf8");
  const declarations = extractDeclarations(css);
  const output = {
    $description:
      "Generated DTCG-compatible exchange export for beslismodel web runtime tokens. CSS remains runtime source; this file is checked for parity.",
    $extensions: {
      [extensionKey]: {
        generatedBy: "scripts/check-design-tokens.mjs",
        source: tokenCssPath,
        specification: sourceUrl,
      },
    },
  };
  const skipped = [];

  for (const [name, value] of declarations) {
    if (!addParsedToken(output, name, value)) skipped.push(name);
  }

  output.$extensions[extensionKey].skippedCssVariables = skipped;
  addThemeMetadata(output);
  return output;
}

const exportObject = buildDtcgExport();
const theme = exportObject.$extensions[extensionKey].theme;
const generated = stringifyTokenExport(exportObject);
const generatedThemeScript = buildThemeScript(theme);
const tokenFile = resolve(tokenJsonPath);
const themeScriptFile = resolve(themeScriptPath);

assertStaticThemeMetadata(theme);

if (isWrite) {
  writeFileSync(tokenFile, generated);
  writeFileSync(themeScriptFile, generatedThemeScript);
  console.log(`Wrote ${tokenJsonPath}`);
  console.log(`Wrote ${themeScriptPath}`);
} else {
  const current = readFileSync(tokenFile, "utf8");
  if (current !== generated) {
    fail(
      [
        `${tokenJsonPath} is out of sync with ${tokenCssPath}.`,
        "Run: npm run tokens:write",
        "Generated preview:",
        inspect(JSON.parse(generated), { depth: 3, maxArrayLength: 4 }),
      ].join("\n"),
    );
  }

  const currentThemeScript = readFileSync(themeScriptFile, "utf8");
  if (currentThemeScript !== generatedThemeScript) {
    fail(
      [`${themeScriptPath} is out of sync with ${tokenCssPath}.`, "Run: npm run tokens:write"].join(
        "\n",
      ),
    );
  }
  console.log("Design token DTCG export and theme script are in sync");
}
