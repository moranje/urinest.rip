import { getQuestionProgress, parseOutcome, toLegacyOutcome } from "../packages/core/dist/index.js";

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

console.log("@beslismodel/core package exports ok");
