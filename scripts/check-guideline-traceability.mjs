import { readFileSync } from "node:fs";

const mainData = JSON.parse(readFileSync(new URL("../public/main.json", import.meta.url), "utf8"));
const traceability = JSON.parse(
  readFileSync(new URL("../docs/guideline-traceability.json", import.meta.url), "utf8"),
);
const guidelinesSource = readFileSync(new URL("../src/lib/guidelines.ts", import.meta.url), "utf8");

const allowedVerdicts = new Set(["supported", "scope-guard", "safety-note"]);
const errors = [];

function fail(message) {
  errors.push(message);
}

function stringify(value) {
  return JSON.stringify(value);
}

function assertSameArray(path, actual, expected) {
  if (stringify(actual) !== stringify(expected)) {
    fail(`${path}: expected ${stringify(expected)}, got ${stringify(actual)}`);
  }
}

function validateEvidenceNode(node, path, sourceIds) {
  if (!node || typeof node !== "object") {
    fail(`${path}: missing evidence node`);
    return;
  }
  if (!node.claim || typeof node.claim !== "string") {
    fail(`${path}: missing claim`);
  }
  if (!allowedVerdicts.has(node.verdict)) {
    fail(`${path}: unsupported verdict "${node.verdict}"`);
  }
  if (!Array.isArray(node.sourceIds) || node.sourceIds.length === 0) {
    fail(`${path}: sourceIds must be a non-empty array`);
    return;
  }
  for (const sourceId of node.sourceIds) {
    if (!sourceIds.has(sourceId)) fail(`${path}: unknown sourceId "${sourceId}"`);
  }
}

function daysBetween(dateA, dateB) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((dateA.getTime() - dateB.getTime()) / msPerDay);
}

function validateFreshness() {
  const maxAgeDays = traceability.maxReviewAgeDays ?? 183;
  const now = new Date();
  const sourceEntries = Object.entries(traceability.sources ?? {});

  for (const [sourceId, source] of sourceEntries) {
    if (!source.title || typeof source.title !== "string") {
      fail(`sources.${sourceId}: missing title`);
    }
    if (!source.publisher || typeof source.publisher !== "string") {
      fail(`sources.${sourceId}: missing publisher`);
    }
    if (!source.url || !source.url.startsWith("https://")) {
      fail(`sources.${sourceId}: url must be https`);
    }
    if (!source.version || typeof source.version !== "string") {
      fail(`sources.${sourceId}: missing version`);
    }
    if (!Array.isArray(source.appliesTo) || source.appliesTo.length === 0) {
      fail(`sources.${sourceId}: appliesTo must be a non-empty array`);
    } else if (source.appliesTo.some((entry) => typeof entry !== "string" || !entry)) {
      fail(`sources.${sourceId}: appliesTo entries must be non-empty strings`);
    }
    if (!Array.isArray(source.limitations) || source.limitations.length === 0) {
      fail(`sources.${sourceId}: limitations must be a non-empty array`);
    } else if (source.limitations.some((entry) => typeof entry !== "string" || !entry)) {
      fail(`sources.${sourceId}: limitations entries must be non-empty strings`);
    }
    if (!source.checkedOn) {
      fail(`sources.${sourceId}: missing checkedOn`);
      continue;
    }
    const checkedOn = new Date(`${source.checkedOn}T00:00:00Z`);
    if (Number.isNaN(checkedOn.getTime())) {
      fail(`sources.${sourceId}: invalid checkedOn ${source.checkedOn}`);
      continue;
    }
    const ageDays = daysBetween(now, checkedOn);
    if (ageDays > maxAgeDays) {
      fail(`sources.${sourceId}: guideline review is stale (${ageDays} days old)`);
    }
  }

  const reviewedIsoMatches = [
    ...guidelinesSource.matchAll(/reviewedIso:\s*"(\d{4}-\d{2}-\d{2})"/g),
  ];
  if (reviewedIsoMatches.length === 0) {
    fail("src/lib/guidelines.ts: no reviewedIso values found");
  }
  for (const match of reviewedIsoMatches) {
    const reviewedOn = new Date(`${match[1]}T00:00:00Z`);
    const ageDays = daysBetween(now, reviewedOn);
    if (ageDays > maxAgeDays) {
      fail(`src/lib/guidelines.ts: reviewedIso ${match[1]} is stale (${ageDays} days old)`);
    }
  }
}

function validateFlow(flow, trace, sourceIds, flowIds) {
  const path = `flows.${flow.id}`;
  validateEvidenceNode(trace, path, sourceIds);
  const optionDefenseRequired = new Set(traceability.optionDefenseRequiredForFlows ?? []).has(
    flow.id,
  );

  const actualQuestions = flow.questions.map((question) => question.id).sort();
  const tracedQuestions = Object.keys(trace.questions ?? {}).sort();
  assertSameArray(`${path}.questions`, actualQuestions, tracedQuestions);

  for (const question of flow.questions) {
    const questionTrace = trace.questions[question.id];
    validateEvidenceNode(questionTrace, `${path}.questions.${question.id}`, sourceIds);
    assertSameArray(
      `${path}.questions.${question.id}.optionValues`,
      question.options.map((option) => String(option.value)),
      questionTrace.optionValues,
    );

    if (optionDefenseRequired) {
      const actualOptionValues = question.options.map((option) => String(option.value)).sort();
      const tracedOptionValues = Object.keys(questionTrace.optionClaims ?? {}).sort();
      assertSameArray(
        `${path}.questions.${question.id}.optionClaims`,
        actualOptionValues,
        tracedOptionValues,
      );
      for (const option of question.options) {
        validateEvidenceNode(
          questionTrace.optionClaims?.[String(option.value)],
          `${path}.questions.${question.id}.optionClaims.${String(option.value)}`,
          sourceIds,
        );
      }
    }
  }

  const actualResultKeys = Object.keys(flow.results).sort();
  const coveredResults = new Map();

  for (const [resultKey, resultTrace] of Object.entries(trace.results ?? {})) {
    if (!flow.results[resultKey]) fail(`${path}.results.${resultKey}: result does not exist`);
    if (coveredResults.has(resultKey)) fail(`${path}.results.${resultKey}: duplicate coverage`);
    coveredResults.set(resultKey, `${path}.results.${resultKey}`);
    validateEvidenceNode(resultTrace, `${path}.results.${resultKey}`, sourceIds);
  }

  for (const group of trace.resultGroups ?? []) {
    validateEvidenceNode(group, `${path}.resultGroups.${group.id ?? "unknown"}`, sourceIds);
    if (!group.id || typeof group.id !== "string") {
      fail(`${path}.resultGroups: group missing id`);
    }
    if (!Array.isArray(group.keys) || group.keys.length === 0) {
      fail(`${path}.resultGroups.${group.id}: keys must be non-empty`);
      continue;
    }
    for (const resultKey of group.keys) {
      if (!flow.results[resultKey]) {
        fail(`${path}.resultGroups.${group.id}: result ${resultKey} does not exist`);
      }
      if (coveredResults.has(resultKey)) {
        fail(`${path}.resultGroups.${group.id}: duplicate coverage for ${resultKey}`);
      }
      coveredResults.set(resultKey, `${path}.resultGroups.${group.id}`);
    }
  }

  assertSameArray(`${path}.result coverage`, actualResultKeys, [...coveredResults.keys()].sort());

  for (const [resultKey, result] of Object.entries(flow.results)) {
    if (!Array.isArray(result.sources) || result.sources.length === 0) {
      fail(`${path}.results.${resultKey}: UI result has no source links`);
      continue;
    }
    for (const [index, source] of result.sources.entries()) {
      if (!source.url || !source.url.startsWith("https://")) {
        fail(`${path}.results.${resultKey}.sources[${index}]: source url must be https`);
      }
    }
  }

  const redirects = [
    ...new Set(
      flow.resultsLogic
        .map((rule) => rule.redirectToQuestionnaire)
        .filter((target) => typeof target === "string"),
    ),
  ].sort();
  const tracedRedirects = Object.keys(trace.redirects ?? {}).sort();
  assertSameArray(`${path}.redirects`, redirects, tracedRedirects);
  for (const target of redirects) {
    if (!flowIds.has(target)) fail(`${path}.redirects.${target}: target flow does not exist`);
    validateEvidenceNode(trace.redirects[target], `${path}.redirects.${target}`, sourceIds);
  }
}

function validate() {
  validateFreshness();

  const sourceIds = new Set(Object.keys(traceability.sources ?? {}));
  if (sourceIds.size === 0) fail("sources: no sources configured");

  const flows = mainData.questionnaires ?? [];
  const flowIds = new Set(flows.map((flow) => flow.id));
  const tracedFlowIds = new Set(Object.keys(traceability.flows ?? {}));
  for (const flowId of traceability.optionDefenseRequiredForFlows ?? []) {
    if (!flowIds.has(flowId)) fail(`optionDefenseRequiredForFlows: unknown flow ${flowId}`);
  }

  assertSameArray("flows", [...flowIds].sort(), [...tracedFlowIds].sort());

  for (const flow of flows) {
    validateFlow(flow, traceability.flows[flow.id], sourceIds, flowIds);
  }
}

validate();

if (errors.length > 0) {
  console.error("Guideline traceability check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Guideline traceability check passed.");
