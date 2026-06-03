import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeViewKey, useAppShell } from "./useAppShell";
import { handleError } from "../lib/errors";

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
      results: {},
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

const ShellHost = {
  setup() {
    return useAppShell();
  },
  template: `
    <section>
      <p data-testid="animate">{{ String(dropletAnimate) }}</p>
      <p data-testid="error">{{ appError ?? '' }}</p>
      <button data-testid="reload" type="button" @click="reloadApp">reload</button>
      <slot />
    </section>
  `,
};

const ThrowingChild = {
  setup() {
    throw new Error("render failed");
  },
  template: `<p />`,
};

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "Landing", component: { template: "<p />" } },
      { path: "/questionnaire/:id", name: "Questionnaire", component: { template: "<p />" } },
    ],
  });
}

describe("useAppShell", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock(),
    });
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: createStorageMock(),
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: false,
      })),
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(manifest), { status: 200 })),
    );
  });

  it("keeps questionnaire routes keyed by route name while other routes use full path", () => {
    expect(routeViewKey({ fullPath: "/questionnaire/strip?q=q1", name: "Questionnaire" })).toBe(
      "questionnaire",
    );
    expect(routeViewKey({ fullPath: "/info/result", name: "Result" })).toBe("/info/result");
  });

  it("loads shell dependencies without owning questionnaire runner code", async () => {
    const router = createTestRouter();
    await router.push("/");
    await router.isReady();

    const wrapper = mount(ShellHost, { global: { plugins: [router] } });
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/main.json"), expect.any(Object));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(wrapper.get('[data-testid="error"]').text()).toBe("");
    wrapper.unmount();
  });

  it("animates the header droplet on route changes", async () => {
    const router = createTestRouter();
    await router.push("/");
    await router.isReady();

    const wrapper = mount(ShellHost, { global: { plugins: [router] } });
    await router.push("/questionnaire/strip");
    await flushPromises();

    expect(wrapper.get('[data-testid="animate"]').text()).toBe("true");
    wrapper.unmount();
  });

  it("captures render errors with friendly shell copy", async () => {
    const router = createTestRouter();
    await router.push("/");
    await router.isReady();

    const wrapper = mount(ShellHost, {
      global: { plugins: [router] },
      slots: { default: ThrowingChild },
    });
    await flushPromises();

    expect(wrapper.get('[data-testid="error"]').text()).toBe(
      "De applicatie kon dit onderdeel niet tonen.",
    );
    expect(handleError).toHaveBeenCalledWith(new Error("render failed"), "app:error-captured");
    wrapper.unmount();
  });
});
