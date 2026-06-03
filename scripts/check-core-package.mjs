import {
  appendAuditTrailEvent,
  appendBreadcrumb,
  classifyBeslismodelError,
  cloneBreadcrumbs,
  createCalculatorRegistry,
  createAuditTrailEvent,
  createBreadcrumb,
  createMarkdownRenderer,
  determineOutcomeWithCalculators,
  createRuntimeContext,
  determineOutcome,
  detectRedirectCycle,
  findNextQuestionId,
  getErrorClass,
  getQuestionProgress,
  nextAuditTrailSequence,
  normalizeDecisionManifest,
  parseOutcome,
  toAuditBreadcrumbData,
  toLegacyOutcome,
  validateConditions,
} from "../packages/core/dist/index.js";

const redirect = parseOutcome("redirect:bacteriurie");
if (redirect.type !== "redirect" || redirect.target !== "bacteriurie") {
  throw new Error("parseOutcome redirect export failed");
}

const result = parseOutcome("result:uti.local.healthy.0");
if (result.type !== "result" || toLegacyOutcome(result) !== "result:uti.local.healthy.0") {
  throw new Error("parseOutcome result export failed");
}

const outcome = determineOutcome({ nitrite: { value: "positive" } }, [
  {
    id: "nitrite-positive",
    actionType: "redirectToQuestionnaire",
    conditions: [{ questionId: "nitrite", operator: "equals", value: "positive" }],
    redirectToQuestionnaire: "bacteriurie",
  },
]);
if (outcome.outcome !== "redirect:bacteriurie" || outcome.ruleId !== "nitrite-positive") {
  throw new Error("determineOutcome export failed");
}

const progress = getQuestionProgress({
  questionnaire: { questionIds: ["q1"], questions: [{ id: "q1" }] },
  currentQuestionId: "q1",
  questionHistory: [],
});
if (progress.text !== "Vraag 1/1") {
  throw new Error("getQuestionProgress export failed");
}

const markdownRenderer = createMarkdownRenderer({
  parse: (markdown) => `<p>${markdown}</p>`,
  sanitize: (html) => html.replace("<script>", ""),
});
if (markdownRenderer.render("tekst") !== "<p>tekst</p>") {
  throw new Error("createMarkdownRenderer export failed");
}

const calculators = createCalculatorRegistry([
  {
    id: "score.sum",
    calculate: (input) => input.values.reduce((sum, value) => sum + value, 0),
  },
]);
if ((await calculators.run("score.sum", { values: [1, 2, 3] })) !== 6) {
  throw new Error("createCalculatorRegistry export failed");
}

const calculatedOutcome = await determineOutcomeWithCalculators({
  registry: calculators,
  answers: { q_values: { value: [1, 2, 3], text: "1,2,3" } },
  calculatorBindings: [
    {
      id: "sum",
      calculatorId: "score.sum",
      input: { values: { source: "answer", key: "q_values" } },
      outputs: { _sum_total: {} },
    },
  ],
  resultsLogic: [
    {
      id: "sum-is-six",
      actionType: "showResult",
      resultKey: "ok",
      conditions: [{ questionId: "_sum_total", operator: "equals", value: 6 }],
    },
  ],
});
if (calculatedOutcome.outcome !== "result:ok") {
  throw new Error("determineOutcomeWithCalculators export failed");
}

const auditEvent = createAuditTrailEvent(
  { type: "flow-start", flowId: "example-flow", version: "1" },
  { sequence: 0, ts: "2026-06-01T00:00:00.000Z" },
);
const auditTrail = appendAuditTrailEvent([], auditEvent);
if (
  nextAuditTrailSequence(auditTrail) !== 1 ||
  toAuditBreadcrumbData(auditEvent).flowId !== "example-flow"
) {
  throw new Error("audit trail export failed");
}

const context = createRuntimeContext({ role: "clinician" });
if (context.get("role") !== "clinician") {
  throw new Error("createRuntimeContext export failed");
}

const normalized = normalizeDecisionManifest({
  questionnaires: [
    {
      id: "example-flow",
      version: "1",
      title: "Example",
      questions: [{ id: "q1", text: "Question", type: "select", options: [] }],
    },
  ],
});
if (normalized.questionnaires["example-flow"]?.questionIds[0] !== "q1") {
  throw new Error("normalizeDecisionManifest export failed");
}

const conditions = validateConditions({ answer: { value: "yes" } }, [
  { questionId: "answer", operator: "equals", value: "yes" },
]);
if (!conditions.isValid || conditions.matchedCount !== 1) {
  throw new Error("validateConditions export failed");
}

const nextQuestionId = findNextQuestionId({
  questionnaire: {
    questions: [{ id: "q1", text: "Question", type: "select", options: [] }],
  },
});
if (nextQuestionId !== "q1") {
  throw new Error("findNextQuestionId export failed");
}

if (!detectRedirectCycle(["a", "b"], "a").hasCycle) {
  throw new Error("detectRedirectCycle export failed");
}

const classified = classifyBeslismodelError({ status: 429, retryAfter: "7" });
if (
  classified.kind !== "rate_limit" ||
  classified.retryAfterSeconds !== 7 ||
  getErrorClass(new Error("hidden detail")) !== "Error"
) {
  throw new Error("error classification export failed");
}

const breadcrumb = createBreadcrumb(
  { type: "click", message: "role-change" },
  { timestamp: "2026-06-01T00:00:00.000Z" },
);
const breadcrumbs = appendBreadcrumb([breadcrumb], { type: "click", message: "role-change" });
if (breadcrumbs[0]?.count !== 2 || cloneBreadcrumbs(breadcrumbs)[0]?.message !== "role-change") {
  throw new Error("breadcrumb export failed");
}

console.log("@beslismodel/core package exports ok");
