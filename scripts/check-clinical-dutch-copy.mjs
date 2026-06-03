import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const visibleStringKeys = new Set([
  "additionalTests",
  "description",
  "documentation",
  "explainer",
  "label",
  "landingDescription",
  "message",
  "name",
  "testAfterTreatment",
  "text",
  "title",
  "treatment",
  "warning",
  "warnings",
]);

const skippedKeys = new Set([
  "audience",
  "category",
  "conditions",
  "domain",
  "hiddenFromLandingPage",
  "id",
  "resultsLogic",
  "safeRoute",
  "sources",
  "type",
  "url",
  "urgency",
  "value",
  "version",
]);

const allowedMetadataKeys = new Set(["landingDescription"]);

const blockedEnglishTerms = [
  "back",
  "choose",
  "click",
  "error",
  "false",
  "follow-up",
  "loading",
  "negative",
  "next",
  "positive",
  "previous",
  "redirect",
  "result",
  "select",
  "submit",
  "treatment",
  "true",
  "unknown",
  "warning",
];

const blockedTermPattern = new RegExp(
  `\\b(${blockedEnglishTerms.map(escapeRegExp).join("|")})\\b`,
  "giu",
);

const unresolvedPattern = /\{\{|\}\}|\$\{|%s|\bTODO\b|\bFIXME\b|\bundefined\b|\[object Object\]/iu;
const genericGuidelinePattern = /\b(conform richtlijn|volgens de richtlijn|beleid conform)\b/iu;
const compactUnitPattern = /\b\d+(?:[,.]\d+)?(?:mg|g|kg|ml|mmol|µg|mcg)\b/iu;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fail(errors, message) {
  errors.push(message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stripUrls(value) {
  return value.replace(/https?:\/\/\S+/giu, "");
}

function validateString(errors, path, value) {
  const trimmed = value.trim();
  if (!trimmed) {
    fail(errors, `${path}: empty visible copy`);
    return;
  }

  if (/<\/?[a-z][^>]*>/iu.test(value)) {
    fail(errors, `${path}: visible copy must not contain raw HTML tags`);
  }

  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(value)) {
    fail(errors, `${path}: visible copy contains control characters`);
  }

  if (unresolvedPattern.test(value)) {
    fail(errors, `${path}: visible copy contains unresolved placeholder text`);
  }

  if (/->|=>/u.test(value)) {
    fail(errors, `${path}: visible copy contains an ASCII arrow; use Dutch prose`);
  }

  const normalized = stripUrls(value);
  const blockedTerms = new Set(
    [...normalized.matchAll(blockedTermPattern)].map((match) => match[0]),
  );
  for (const blockedTerm of blockedTerms) {
    fail(errors, `${path}: English UI/internal term "${blockedTerm}" in visible copy`);
  }

  const genericGuidelineCopy = normalized.match(genericGuidelinePattern)?.[0];
  if (genericGuidelineCopy) {
    fail(errors, `${path}: generic guideline phrase "${genericGuidelineCopy}" is not actionable`);
  }

  const compactUnit = normalized.match(compactUnitPattern)?.[0];
  if (compactUnit) {
    fail(errors, `${path}: medication/unit copy "${compactUnit}" needs a space before the unit`);
  }
}

function walkMetadata(errors, value, path) {
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (!allowedMetadataKeys.has(key)) continue;
    walkVisible(errors, child, `${path}.${key}`, key);
  }
}

function walkVisible(errors, value, path, key) {
  if (typeof value === "string") {
    if (visibleStringKeys.has(key)) validateString(errors, path, value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => walkVisible(errors, item, `${path}[${index}]`, key));
    return;
  }

  if (!isRecord(value)) return;

  for (const [childKey, child] of Object.entries(value)) {
    if (childKey === "metadata") {
      walkMetadata(errors, child, `${path}.${childKey}`);
      continue;
    }
    if (skippedKeys.has(childKey)) continue;
    walkVisible(errors, child, `${path}.${childKey}`, childKey);
  }
}

export function validateClinicalDutchCopy(manifest) {
  const errors = [];
  const questionnaires = manifest?.questionnaires;
  if (!Array.isArray(questionnaires) || questionnaires.length === 0) {
    fail(errors, "public/main.json: no questionnaires found");
    return errors;
  }

  questionnaires.forEach((questionnaire, index) => {
    walkVisible(errors, questionnaire, `questionnaires[${index}]`, "questionnaire");
  });

  return errors;
}

function runCli() {
  const manifest = JSON.parse(
    readFileSync(new URL("../public/main.json", import.meta.url), "utf8"),
  );
  const errors = validateClinicalDutchCopy(manifest);

  if (errors.length > 0) {
    console.error("Clinical Dutch copy check failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log("Clinical Dutch copy check passed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
