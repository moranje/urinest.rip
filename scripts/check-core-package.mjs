import {
  appendAuditTrailEvent,
  classifyBeslismodelError,
  createCalculatorRegistry,
  createAuditTrailEvent,
  createMarkdownRenderer,
  createRuntimeContext,
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

console.log("@beslismodel/core package exports ok");
