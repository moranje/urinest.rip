import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { computed, defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleError } from "../lib/errors";
import { useResultPage } from "./useResultPage";

vi.mock("../lib/log-sink", () => ({
  persistError: vi.fn(),
  persistTelemetry: vi.fn(),
}));

vi.mock("../lib/framework-telemetry", () => ({
  createSupabaseTelemetryAdapter: () => ({ track: vi.fn() }),
}));

vi.mock("../lib/breadcrumbs", () => ({
  breadcrumbApi: vi.fn(),
  breadcrumbClick: vi.fn(),
  breadcrumbLog: vi.fn(),
}));

vi.mock("../lib/errors", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/errors")>();
  return {
    ...actual,
    handleError: vi.fn(),
  };
});

const manifest = {
  questionnaires: [
    {
      id: "strip",
      title: "Urinestrip",
      questions: [],
      steps: [],
      results: {
        first: {
          title: "Eerste resultaat",
          documentation: "  EPD tekst  ",
        },
        second: {
          title: "Tweede resultaat",
        },
      },
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

const ResultHost = defineComponent({
  props: {
    resultKey: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    return useResultPage(computed(() => props.resultKey));
  },
  template: `
    <div>
      <p data-testid="loading">{{ String(isLoading) }}</p>
      <p data-testid="title">{{ resultData?.title ?? '' }}</p>
      <p data-testid="documentation">{{ planDocumentation }}</p>
      <p data-testid="error">{{ error ?? '' }}</p>
    </div>
  `,
});

describe("useResultPage", () => {
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
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(manifest), { status: 200 })),
    );
  });

  it("loads result data and trims documentation", async () => {
    const wrapper = mount(ResultHost, { props: { resultKey: "first" } });
    await flushPromises();

    expect(wrapper.get('[data-testid="loading"]').text()).toBe("false");
    expect(wrapper.get('[data-testid="title"]').text()).toBe("Eerste resultaat");
    expect(wrapper.get('[data-testid="documentation"]').text()).toBe("EPD tekst");
    expect(wrapper.get('[data-testid="error"]').text()).toBe("");
    wrapper.unmount();
  });

  it("reloads when the route result key changes", async () => {
    const wrapper = mount(ResultHost, { props: { resultKey: "first" } });
    await flushPromises();

    await wrapper.setProps({ resultKey: "second" });
    await flushPromises();

    expect(wrapper.get('[data-testid="title"]').text()).toBe("Tweede resultaat");
    expect(wrapper.get('[data-testid="documentation"]').text()).toBe("");
    wrapper.unmount();
  });

  it("reports unknown result keys with available questionnaire context", async () => {
    const wrapper = mount(ResultHost, { props: { resultKey: "missing" } });
    await flushPromises();

    expect(wrapper.get('[data-testid="title"]').text()).toBe("");
    expect(wrapper.get('[data-testid="error"]').text()).toBe(
      'Resultaat "missing" niet gevonden. Doorzochte vragenlijsten: strip',
    );
    expect(handleError).toHaveBeenCalledWith(
      new Error("Result key not found: missing"),
      "result-page:key-not-found",
      {
        availableKeys: ["first", "second"],
        questionnaires: ["strip"],
        resultKey: "missing",
      },
    );
    wrapper.unmount();
  });

  it("shows a friendly loading error when manifest loading fails", async () => {
    const loadError = new Error("network down");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw loadError;
      }),
    );

    const wrapper = mount(ResultHost, { props: { resultKey: "first" } });
    await flushPromises();

    expect(wrapper.get('[data-testid="title"]').text()).toBe("");
    expect(wrapper.get('[data-testid="error"]').text()).toBe("Kon vragenlijstgegevens niet laden");
    expect(handleError).toHaveBeenCalledWith(loadError, "result-page:load-data", {
      resultKey: "first",
    });
    wrapper.unmount();
  });
});
