import { beforeAll, describe, expect, it } from "vitest";
import { createCalculatorRegistry, type CalculatorDefinition } from "@beslismodel/core";
import { compileFlowFiles, type CompiledDecisionManifest } from "@beslismodel/compiler";
import {
  createBeslismodelDataReadyGuard,
  useQuestionnaireRunner,
  useResultResolver,
} from "@beslismodel/vue";
import { createUrinestripConsumerStore, type ConsumerAnswer } from "./consumer-store";

let manifest: CompiledDecisionManifest;

const answer = (value: string, text = value): ConsumerAnswer => ({ text, value });

interface ConsumerScoreInput {
  readonly values: readonly number[];
}

const isConsumerScoreInput = (input: unknown): input is ConsumerScoreInput =>
  typeof input === "object" &&
  input !== null &&
  "values" in input &&
  Array.isArray((input as ConsumerScoreInput).values) &&
  (input as ConsumerScoreInput).values.every((value) => typeof value === "number");

const resolveStrip = async (answers: Record<string, ConsumerAnswer>) => {
  const { store } = createUrinestripConsumerStore(manifest);
  await store.loadInitialData();
  for (const [questionId, value] of Object.entries(answers)) {
    store.setAnswer("strip", questionId, value);
  }
  const resolver = useResultResolver(store);
  return resolver.resolveResult("strip");
};

describe("urinestrip package consumer", () => {
  beforeAll(async () => {
    manifest = await compileFlowFiles("flows");
  });

  it("loads the real urine guideline manifest through package APIs", async () => {
    const ids = new Set(manifest.questionnaires.map((questionnaire) => questionnaire.id));
    expect(ids.has("strip")).toBe(true);
    expect(ids.has("bacteriurie")).toBe(true);
    expect(ids.has("leukocyturie")).toBe(true);
    expect(ids.has("hematurie")).toBe(true);

    const { store } = createUrinestripConsumerStore(manifest);
    const guard = createBeslismodelDataReadyGuard({
      useStore: () => store,
    });
    const runGuard = guard as unknown as (to: unknown, from: unknown) => Promise<unknown>;

    await expect(runGuard({ fullPath: "/questionnaire/strip" }, {})).resolves.toBe(true);
    expect(store.getQuestionnaireById("strip")?.title).toBe("Urinestrip");
  });

  it("registers consumer-owned calculators without putting domain logic in core", async () => {
    const registry = createCalculatorRegistry([
      {
        id: "fixture.consumer-score",
        version: "fixture-1",
        label: "Consumer score",
        validateInput: isConsumerScoreInput,
        calculate: (input, context) => ({
          score: input.values.reduce((sum, value) => sum + value, 0),
          role: context.role,
        }),
      } satisfies CalculatorDefinition<ConsumerScoreInput, { score: number; role?: string }>,
    ]);

    await expect(
      registry.run<{ score: number; role?: string }>(
        "fixture.consumer-score",
        { values: [1, 2, 3] },
        { role: "triagist", locale: "nl-NL" },
      ),
    ).resolves.toEqual({ score: 6, role: "triagist" });
  });

  it("navigates strip questions with the package runner", async () => {
    const { store } = createUrinestripConsumerStore(manifest);
    await store.loadInitialData();
    const runner = useQuestionnaireRunner(store, { questionnaireId: "strip" });

    expect(runner.start()).toEqual({
      previousQuestionId: null,
      questionId: "q_strip_nitrite",
      type: "question",
    });
    expect(runner.progress.value.text).toBe("Vraag 1/3");

    store.setAnswer("strip", "q_strip_nitrite", answer("negative"));
    expect(runner.advance()).toEqual({
      previousQuestionId: "q_strip_nitrite",
      questionId: "q_strip_leuko",
      type: "question",
    });

    store.setAnswer("strip", "q_strip_leuko", answer("negative"));
    expect(runner.advance()).toEqual({
      previousQuestionId: "q_strip_leuko",
      questionId: "q_strip_ery",
      type: "question",
    });
    expect(runner.currentStep.value?.id).toBe("s_strip_3");
  });

  it("redirects nitrite positive to bacteriurie", async () => {
    await expect(
      resolveStrip({
        q_strip_nitrite: answer("positive"),
      }),
    ).resolves.toEqual(expect.objectContaining({ targetQuestionnaireId: "bacteriurie" }));
  });

  it("redirects nitrite negative with leukocytes positive to leukocyturie", async () => {
    await expect(
      resolveStrip({
        q_strip_nitrite: answer("negative"),
        q_strip_leuko: answer("positive_1"),
      }),
    ).resolves.toEqual(expect.objectContaining({ targetQuestionnaireId: "leukocyturie" }));
  });

  it("redirects erythrocytes positive to hematurie", async () => {
    await expect(
      resolveStrip({
        q_strip_nitrite: answer("negative"),
        q_strip_leuko: answer("negative"),
        q_strip_ery: answer("positive_1"),
      }),
    ).resolves.toEqual(expect.objectContaining({ targetQuestionnaireId: "hematurie" }));
  });

  it("returns the strip negative result when all values are negative", async () => {
    await expect(
      resolveStrip({
        q_strip_nitrite: answer("negative"),
        q_strip_leuko: answer("negative"),
        q_strip_ery: answer("negative"),
      }),
    ).resolves.toEqual(expect.objectContaining({ resultKey: "other.noConclusiveAbnormality" }));
  });
});
