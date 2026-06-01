import { describe, expect, it, vi } from "vitest";
import {
  useQuestionnaireRunner,
  type BeslismodelQuestionnaireRunnerStore,
} from "./questionnaire-runner";

interface TestAnswer {
  value: string;
  text: string;
}

const questions = [
  { id: "q1", text: "First", type: "select", options: [] },
  {
    id: "q2",
    text: "Conditional",
    type: "select",
    options: [],
    conditions: [{ questionId: "q1", operator: "equals", value: "show" }],
  },
  { id: "q3", text: "Multi", type: "multi_select", options: [] },
];

const steps = [
  { id: "step-1", questionIds: ["q1"] },
  { id: "step-2", questionIds: ["q2", "q3"] },
];

const questionnaire = {
  id: "example-flow",
  version: "1",
  questionIds: ["q1", "q2", "q3"],
  stepIds: ["step-1", "step-2"],
};

const fullQuestionnaire = {
  ...questionnaire,
  questions,
  steps,
};

const createStore = (
  answers: Record<string, TestAnswer | TestAnswer[]> = {},
): BeslismodelQuestionnaireRunnerStore<TestAnswer | TestAnswer[]> => ({
  getAllAnswersForQuestionnaire: vi.fn(() => answers),
  getAnswer: vi.fn((_questionnaireId: string, questionId: string) => answers[questionId]),
  getEnhancedAnswers: vi.fn(() => answers),
  getFullQuestionnaire: vi.fn((questionnaireId: string) =>
    questionnaireId === "missing" ? null : fullQuestionnaire,
  ),
  getQuestionById: vi.fn((questionId: string) =>
    questions.find((question) => question.id === questionId),
  ),
  getQuestionnaireById: vi.fn((questionnaireId: string) =>
    questionnaireId === "missing" ? undefined : questionnaire,
  ),
  getStepById: vi.fn((stepId: string) => steps.find((step) => step.id === stepId)),
  setAnswer: vi.fn((_: string, questionId: string, answer: TestAnswer | TestAnswer[]) => {
    answers[questionId] = answer;
  }),
});

describe("useQuestionnaireRunner", () => {
  it("starts at the first visible question and reports progress", () => {
    const runner = useQuestionnaireRunner(createStore(), { questionnaireId: "example-flow" });

    expect(runner.start()).toEqual({
      previousQuestionId: null,
      questionId: "q1",
      type: "question",
    });
    expect(runner.currentQuestion.value?.id).toBe("q1");
    expect(runner.currentStep.value?.id).toBe("step-1");
    expect(runner.progress.value.text).toBe("Vraag 1/3");
  });

  it("advances through the next visible question and completes at the end", () => {
    const answers = {
      q1: { value: "hide", text: "Hide" },
      q3: [{ value: "done", text: "Done" }],
    };
    const runner = useQuestionnaireRunner(createStore(answers), {
      questionnaireId: "example-flow",
    });

    runner.start({ replayAnswers: false });
    expect(runner.advance()).toEqual({
      previousQuestionId: "q1",
      questionId: "q3",
      type: "question",
    });
    expect(runner.currentStep.value?.id).toBe("step-2");
    expect(runner.isMultiSelect.value).toBe(true);
    expect(runner.hasSelectedOptions.value).toBe(true);
    expect(runner.selectedCount.value).toBe(1);
    expect(runner.advance()).toEqual({
      previousQuestionId: "q3",
      type: "complete",
    });
  });

  it("replays stored answers to the first unanswered visible question", () => {
    const answers = {
      q1: { value: "show", text: "Show" },
      q2: { value: "yes", text: "Yes" },
    };
    const runner = useQuestionnaireRunner(createStore(answers), {
      questionnaireId: "example-flow",
    });

    expect(runner.start()).toEqual({
      previousQuestionId: null,
      questionId: "q3",
      type: "question",
    });
    expect(runner.questionHistory.value).toEqual(["q1", "q2"]);
    expect(runner.hasHistory.value).toBe(true);
  });

  it("goes back through question history", () => {
    const runner = useQuestionnaireRunner(createStore(), { questionnaireId: "example-flow" });

    runner.start();
    runner.advance();
    expect(runner.goBack()).toEqual({
      previousQuestionId: "q3",
      questionId: "q1",
      type: "question",
    });
    expect(runner.questionHistory.value).toEqual([]);
  });

  it("selects single options and advances with the option id as branch", () => {
    const answers: Record<string, TestAnswer | TestAnswer[]> = {};
    const store = createStore(answers);
    const runner = useQuestionnaireRunner(store, { questionnaireId: "example-flow" });

    runner.start();
    expect(runner.selectOption({ id: "o_show", text: "Show", value: "show" })).toEqual({
      branch: "o_show",
      previousQuestionId: "q1",
      questionId: "q2",
      type: "question",
    });
    expect(answers.q1).toEqual({ text: "Show", value: "show" });
    expect(runner.isOptionSelected({ value: "show" })).toBe(false);
  });

  it("toggles multiple options and confirms with a stable value branch", () => {
    const answers = {
      q1: { value: "hide", text: "Hide" },
    };
    const runner = useQuestionnaireRunner(createStore(answers), {
      questionnaireId: "example-flow",
    });

    runner.start({ replayAnswers: false });
    runner.advance();
    expect(runner.currentQuestionId.value).toBe("q3");
    expect(runner.toggleOption({ text: "B", value: "b" })).toEqual([{ text: "B", value: "b" }]);
    expect(runner.toggleOption({ text: "A", value: "a" })).toEqual([
      { text: "B", value: "b" },
      { text: "A", value: "a" },
    ]);
    expect(runner.isOptionSelected({ value: "a" })).toBe(true);
    expect(runner.selectedCount.value).toBe(2);
    expect(runner.confirmMultipleChoice()).toEqual({
      branch: "a+b",
      previousQuestionId: "q3",
      type: "complete",
    });
  });

  it("reports missing questionnaires without app-owned routing", () => {
    const runner = useQuestionnaireRunner(createStore(), { questionnaireId: "missing" });

    expect(runner.start()).toEqual({
      questionnaireId: "missing",
      type: "missing",
    });
    expect(runner.advance()).toEqual({
      questionnaireId: "missing",
      type: "missing",
    });
  });
});
