import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQuestionnaireStore } from "./questionnaireStore";
import { useRoleStore } from "./roleStore";

vi.mock("../lib/log-sink", () => ({
  persistTelemetry: vi.fn(),
}));

vi.mock("../lib/breadcrumbs", () => ({
  breadcrumbApi: vi.fn(),
  breadcrumbClick: vi.fn(),
}));

const manifest = {
  questionnaires: [
    {
      id: "first-flow",
      version: "1",
      name: "First",
      title: "First flow",
      questions: [{ id: "q1", text: "Question", type: "select", options: [] }],
      steps: [{ id: "step-1", questionIds: ["q1"] }],
      results: { shared: { title: "First result" } },
      resultsLogic: [{ conditions: [], actionType: "showResult", resultKey: "shared" }],
    },
    {
      id: "second-flow",
      title: "Second flow",
      questions: [],
      steps: [],
      results: { shared: { title: "Second result" } },
      resultsLogic: [],
    },
  ],
};

const createStorageMock = (): Storage => {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: vi.fn(() => items.clear()),
    getItem: vi.fn((key: string) => items.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(items.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      items.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      items.set(key, value);
    }),
  };
};

describe("questionnaire store normalization", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock(),
    });
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: createStorageMock(),
    });
    setActivePinia(createPinia());
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(manifest), { status: 200 })),
    );
  });

  it("loads manifests through core normalization while preserving app compatibility", async () => {
    const questionnaireStore = useQuestionnaireStore();

    await questionnaireStore.loadInitialData();

    expect(questionnaireStore.dataReady).toBe(true);
    expect(questionnaireStore.getQuestionnaireById("second-flow")?.version).toBe("unknown");
    expect(questionnaireStore.getResultByKey("shared")?.title).toBe("Second result");
    expect(questionnaireStore.getFullQuestionnaire("first-flow")?.resultsLogic[0]?.id).toBe(
      "first-flow-rule-0",
    );
  });

  it("injects runtime context into decision-engine answers", async () => {
    const roleStore = useRoleStore();
    const questionnaireStore = useQuestionnaireStore();
    await questionnaireStore.loadInitialData();

    roleStore.setRole("triagist");
    questionnaireStore.setAnswer("first-flow", "q1", { value: "yes", text: "Yes" });

    expect(questionnaireStore.getRuntimeContext().get("role")).toBe("triagist");
    expect(questionnaireStore.getEnhancedAnswers("first-flow")).toEqual({
      q1: { value: "yes", text: "Yes" },
      role: "triagist",
      _role: "triagist",
    });
  });
});
