import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createBeslismodelStore,
  type BeslismodelManifestInput,
  type BeslismodelStorageAdapter,
} from "./store";

const createStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial));
  const adapter: BeslismodelStorageAdapter = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };

  return { adapter, values };
};

class MissingManifestError extends Error {}

describe("createBeslismodelStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("loads manifests once, normalizes data, restores answers and injects runtime context", async () => {
    const storage = createStorage({
      answers: JSON.stringify({
        version: 1,
        updatedAt: 1000,
        answers: {
          "example-flow": {
            q1: { value: "stored", text: "Stored" },
          },
          stale: {
            other: { value: "ignored", text: "Ignored" },
          },
        },
      }),
    });
    const telemetry = {
      track: vi.fn(),
    };
    let resolveManifest: (value: BeslismodelManifestInput<{ title: string }>) => void = () => {
      throw new Error("manifest resolver was not initialized");
    };
    const loadManifest = vi.fn(
      () =>
        new Promise<BeslismodelManifestInput<{ title: string }>>((resolve) => {
          resolveManifest = resolve;
        }),
    );
    const outcomeResolver = vi.fn(() => ({
      outcome: "result:shared",
      ruleId: "example-flow-rule-0",
    }));
    const onManifestLoaded = vi.fn();
    const useStore = createBeslismodelStore<{ title: string }>({
      answersStorage: storage.adapter,
      answersStorageKey: "answers",
      answersTtlMs: 5000,
      contextProvider: () => ({ role: "behandelaar" }),
      contextAliases: { role: "_role" },
      duplicateIdPolicy: "overwrite",
      loadManifest,
      now: () => 1000,
      onManifestLoaded,
      outcomeResolver,
      telemetry,
    });

    const store = useStore();
    const firstLoad = store.loadInitialData();
    const secondLoad = store.loadInitialData();

    expect(loadManifest).toHaveBeenCalledTimes(1);
    resolveManifest({
      questionnaires: [
        {
          id: "example-flow",
          title: "Example",
          category: "test",
          audience: ["tester"],
          domain: "test",
          recommendedStart: true,
          questions: [{ id: "q1", text: "Question", type: "select", options: [] }],
          steps: [{ id: "step-1", questionIds: ["q1"] }],
          results: { shared: { title: "First result" } },
          resultsLogic: [{ conditions: [], actionType: "showResult", resultKey: "shared" }],
        },
        {
          id: "second-flow",
          version: "2",
          title: "Second",
          questions: [],
          steps: [],
          results: { shared: { title: "Second result" } },
          resultsLogic: [],
        },
      ],
    });
    await Promise.all([firstLoad, secondLoad]);

    expect(store.loading).toBe(false);
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.runtimeContext).toEqual({ role: "behandelaar" });
    expect(store.getRuntimeContext().get("role")).toBe("behandelaar");
    expect(store.getQuestionnaireById("example-flow")).toEqual(
      expect.objectContaining({
        id: "example-flow",
        version: "unknown",
        category: "test",
        recommendedStart: true,
      }),
    );
    expect(store.getResultByKey("shared")?.title).toBe("Second result");
    expect(store.getFullQuestionnaire("example-flow")?.resultsLogic[0]?.id).toBe(
      "example-flow-rule-0",
    );
    expect(store.getAnswer("example-flow", "q1")).toEqual({ value: "stored", text: "Stored" });
    expect(store.getEnhancedAnswers("example-flow")).toEqual({
      q1: { value: "stored", text: "Stored" },
      role: "behandelaar",
      _role: "behandelaar",
    });

    store.setAnswer("example-flow", "q1", { value: "yes", text: "Yes" });
    expect(JSON.parse(storage.values.get("answers") ?? "{}").answers["example-flow"].q1).toEqual({
      value: "yes",
      text: "Yes",
    });

    const outcome = store.determineOutcomeForPath(
      "example-flow",
      store.getAllAnswersForQuestionnaire("example-flow"),
      store.getFullQuestionnaire("example-flow")?.resultsLogic ?? [],
    );
    expect(outcome).toEqual({ outcome: "result:shared", ruleId: "example-flow-rule-0" });
    expect(outcomeResolver).toHaveBeenCalledWith(
      {
        q1: { value: "yes", text: "Yes" },
        role: "behandelaar",
        _role: "behandelaar",
      },
      expect.any(Array),
      expect.any(Object),
    );
    expect(onManifestLoaded).toHaveBeenCalledOnce();
    expect(telemetry.track).toHaveBeenCalledWith({
      type: "manifest.loaded",
      storeId: "beslismodel",
      questionnaireCount: 2,
    });
  });

  it("routes load errors through typed telemetry without leaking Error objects", async () => {
    const telemetry = {
      track: vi.fn(),
    };
    const onError = vi.fn();
    const loadError = new MissingManifestError("patient specific missing manifest");
    const useStore = createBeslismodelStore({
      loadManifest: async () => {
        throw loadError;
      },
      onError,
      telemetry,
    });

    const store = useStore();
    await expect(store.load()).rejects.toThrow(loadError);

    expect(store.loading).toBe(false);
    expect(store.error).toBe(loadError);
    expect(telemetry.track).toHaveBeenCalledWith({
      type: "manifest.load_failed",
      phase: "manifest.load",
      storeId: "beslismodel",
      errorClass: "MissingManifestError",
    });
    expect(onError).toHaveBeenCalledWith(loadError, {
      phase: "manifest.load",
      storeId: "beslismodel",
    });
    expect(JSON.stringify(telemetry.track.mock.calls)).not.toContain("patient specific");
    expect(telemetry.track.mock.calls[0]?.[0]).not.toHaveProperty("error");
  });

  it("keeps manifest loading cached in memory unless force reload is requested", async () => {
    let version = 0;
    const loadManifest = vi.fn(async () => ({
      questionnaires: [
        {
          id: "example-flow",
          title: `Example ${++version}`,
          questions: [],
          steps: [],
          results: {},
          resultsLogic: [],
        },
      ],
    }));
    const useStore = createBeslismodelStore({ loadManifest });
    const store = useStore();

    await store.loadInitialData();
    await store.loadInitialData();
    expect(loadManifest).toHaveBeenCalledTimes(1);
    expect(store.getQuestionnaireById("example-flow")?.title).toBe("Example 1");

    await store.loadInitialData({ force: true });
    expect(loadManifest).toHaveBeenCalledTimes(2);
    expect(store.getQuestionnaireById("example-flow")?.title).toBe("Example 2");
  });

  it("can reload manifests on every load for consumers that disable memory cache", async () => {
    let version = 0;
    const loadManifest = vi.fn(async () => ({
      questionnaires: [
        {
          id: "example-flow",
          title: `Example ${++version}`,
          questions: [],
          steps: [],
          results: {},
          resultsLogic: [],
        },
      ],
    }));
    const useStore = createBeslismodelStore({
      loadManifest,
      manifestCacheStrategy: "reload",
    });
    const store = useStore();

    await store.loadInitialData();
    await store.loadInitialData();

    expect(loadManifest).toHaveBeenCalledTimes(2);
    expect(store.getQuestionnaireById("example-flow")?.title).toBe("Example 2");
  });
});
