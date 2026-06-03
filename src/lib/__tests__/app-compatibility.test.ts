import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getQuestionnaireRoleContext,
  landingIconKeys,
  loadQuestionnaireManifest,
  questionnairePath,
  renderAppMarkdown,
  reportQuestionnaireVersions,
  resolveLandingIconComponent,
} from "../app-compatibility";
import { breadcrumbApi } from "../breadcrumbs";
import { persistTelemetry } from "../log-sink";
import { useRoleStore } from "../../store/roleStore";

vi.mock("../breadcrumbs", () => ({
  breadcrumbApi: vi.fn(),
  breadcrumbClick: vi.fn(),
  breadcrumbLog: vi.fn(),
}));

vi.mock("../log-sink", () => ({
  persistTelemetry: vi.fn(),
}));

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

describe("app compatibility adapters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock(),
    });
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: createStorageMock(),
    });
    setActivePinia(createPinia());
  });

  it("loads the app manifest through the framework loadManifest adapter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              metadata: { generatedAt: "2026-06-03T00:00:00.000Z" },
              questionnaires: [
                {
                  id: "strip",
                  title: "Urinestrip",
                  icon: "strip",
                  metadata: { landingSection: "primary" },
                },
              ],
            }),
            { status: 200 },
          ),
      ),
    );

    const manifest = await loadQuestionnaireManifest();

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/^\/main\.json\?t=\d+$/), {
      signal: expect.any(AbortSignal),
    });
    expect(breadcrumbApi).toHaveBeenCalledWith("GET", "/main.json", expect.any(Number));
    expect(manifest).toEqual({
      metadata: { generatedAt: "2026-06-03T00:00:00.000Z" },
      questionnaires: [
        {
          id: "strip",
          version: undefined,
          name: undefined,
          title: "Urinestrip",
          description: undefined,
          category: undefined,
          audience: undefined,
          domain: undefined,
          icon: "strip",
          hiddenFromLandingPage: undefined,
          recommendedStart: undefined,
          metadata: { landingSection: "primary" },
          questions: [],
          steps: [],
          results: {},
          resultsLogic: [],
        },
      ],
    });
  });

  it("keeps role context app-owned for framework runtime aliases", () => {
    const roleStore = useRoleStore();
    roleStore.setRole("triagist");

    expect(getQuestionnaireRoleContext()).toEqual({ role: "triagist" });
  });

  it("keeps landing taxonomy and icon mapping app-owned", () => {
    expect(landingIconKeys).toEqual(["culture", "dipslide", "healthy", "sediment", "strip"]);
    expect(questionnairePath("strip")).toBe("/questionnaire/strip");
    expect(resolveLandingIconComponent("strip")).toBeTruthy();
    expect(resolveLandingIconComponent("unknown")).toBeNull();
  });

  it("keeps markdown parsing and sanitizing app-owned", () => {
    const markdownHtml = renderAppMarkdown("**Vet**");
    const unsafeHtml = renderAppMarkdown('<img src="x" onerror="alert(1)">');

    expect(markdownHtml).toContain("<strong>Vet</strong>");
    expect(unsafeHtml).not.toContain("onerror");
  });

  it("reports flow versions and guideline review dates through app telemetry", () => {
    reportQuestionnaireVersions({} as never, {
      strip: {
        id: "strip",
        name: "Urinestrip",
        title: "Urinestrip",
        version: "1",
        questionIds: [],
        stepIds: [],
        resultsLogicIds: [],
      },
    });

    expect(persistTelemetry).toHaveBeenCalledWith({
      module: "questionnaire-store",
      message: "flow.versions",
      context: {
        flows: [{ id: "strip", version: "1" }],
        guidelines: expect.arrayContaining([
          expect.objectContaining({ name: "NHG-Standaard Urineweginfecties" }),
        ]),
      },
    });
  });
});
