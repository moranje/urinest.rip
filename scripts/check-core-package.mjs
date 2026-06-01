import {
  createCalculatorRegistry,
  createMarkdownRenderer,
  getQuestionProgress,
  parseOutcome,
  toLegacyOutcome,
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

console.log("@beslismodel/core package exports ok");
