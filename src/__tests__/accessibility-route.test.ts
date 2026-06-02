import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import axe from "axe-core";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter, type Router } from "vue-router";
import { nextTick } from "vue";
import LandingPage from "../views/LandingPage.vue";
import QuestionnairePage from "../views/QuestionnairePage.vue";
import ResultPage from "../views/ResultPage.vue";
import ErrorPage from "../views/ErrorPage.vue";
import mainData from "../../public/main.json";

vi.mock("../lib/log-sink", () => ({
  persistError: vi.fn(),
  persistTelemetry: vi.fn(),
}));

vi.mock("../lib/framework-telemetry", () => ({
  createSupabaseTelemetryAdapter: () => ({ track: vi.fn() }),
}));

interface AxeResult {
  violations: Array<{ id: string; impact?: string; description: string }>;
}

const AXE_TEST_TIMEOUT_MS = 20_000;

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "Landing", component: LandingPage },
      {
        path: "/questionnaire/:id",
        name: "Questionnaire",
        component: QuestionnairePage,
        props: true,
      },
      { path: "/info/:resultKey", name: "Result", component: ResultPage, props: true },
      { path: "/error", name: "Error", component: ErrorPage },
    ],
  });
}

async function runAxe(wrapper: VueWrapper): Promise<AxeResult> {
  const landmark = document.createElement("main");
  landmark.id = "route-axe-root";
  landmark.appendChild(wrapper.element);
  document.body.appendChild(landmark);
  try {
    return (await axe.run(landmark, {
      runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
    })) as AxeResult;
  } finally {
    document.body.removeChild(landmark);
  }
}

async function settleRouteUi(): Promise<void> {
  await flushPromises();
  await nextTick();
  await flushPromises();
}

async function mountRouteView(
  component: typeof LandingPage | typeof QuestionnairePage | typeof ResultPage | typeof ErrorPage,
  routePath: string,
  props: Record<string, unknown> = {},
): Promise<VueWrapper> {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createTestRouter();
  router.push(routePath);
  await router.isReady();

  const wrapper = mount(component, {
    attachTo: document.body,
    props,
    global: {
      plugins: [pinia, router],
    },
  });
  await settleRouteUi();
  return wrapper;
}

describe("route accessibility smoke", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(mainData), { status: 200 })),
    );
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it(
    "landing route has no axe violations",
    async () => {
      const wrapper = await mountRouteView(LandingPage, "/");
      const result = await runAxe(wrapper);

      expect(result.violations.map((violation) => violation.id)).toEqual([]);
      wrapper.unmount();
    },
    AXE_TEST_TIMEOUT_MS,
  );

  it(
    "questionnaire route has no axe violations",
    async () => {
      const wrapper = await mountRouteView(QuestionnairePage, "/questionnaire/strip", {
        id: "strip",
      });
      const result = await runAxe(wrapper);

      expect(result.violations.map((violation) => violation.id)).toEqual([]);
      wrapper.unmount();
    },
    AXE_TEST_TIMEOUT_MS,
  );

  it(
    "urinestrip route supports keyboard flow, labels, and focus order",
    async () => {
      const wrapper = await mountRouteView(QuestionnairePage, "/questionnaire/strip", {
        id: "strip",
      });

      const title = wrapper.get("h1");
      expect(title.text()).toBe("Nitriet test");
      expect(title.attributes("tabindex")).toBe("-1");
      expect(document.activeElement).toBe(title.element);

      const group = wrapper.get('[role="radiogroup"]');
      expect(group.attributes("aria-labelledby")).toBe(title.attributes("id"));
      expect(group.attributes("aria-describedby")).toBeUndefined();

      const nitriteOptions = wrapper.findAll<HTMLButtonElement>('[role="radio"]');
      expect(nitriteOptions.map((option) => option.attributes("aria-checked"))).toEqual([
        "false",
        "false",
      ]);
      expect(nitriteOptions.map((option) => option.attributes("tabindex"))).toEqual(["0", "-1"]);

      nitriteOptions[0]?.element.focus();
      await nitriteOptions[0]?.trigger("keydown.right");
      expect(document.activeElement).toBe(nitriteOptions[1]?.element);

      await nitriteOptions[1]?.trigger("keydown.space");
      await settleRouteUi();

      const nextTitle = wrapper.get("h1");
      expect(nextTitle.text()).toBe("Leukocyten test");
      expect(document.activeElement).toBe(nextTitle.element);
      expect(wrapper.get('[role="radiogroup"]').attributes("aria-labelledby")).toBe(
        nextTitle.attributes("id"),
      );
      expect(
        wrapper.findAll('[role="radio"]').map((option) => option.attributes("tabindex")),
      ).toEqual(["0", "-1", "-1", "-1"]);

      wrapper.unmount();
    },
    AXE_TEST_TIMEOUT_MS,
  );

  it(
    "result route has no axe violations",
    async () => {
      const wrapper = await mountRouteView(ResultPage, "/info/other.noConclusiveAbnormality", {
        resultKey: "other.noConclusiveAbnormality",
      });
      const result = await runAxe(wrapper);

      expect(result.violations.map((violation) => violation.id)).toEqual([]);
      wrapper.unmount();
    },
    AXE_TEST_TIMEOUT_MS,
  );

  it(
    "error route has no axe violations",
    async () => {
      const wrapper = await mountRouteView(ErrorPage, "/error?message=Laden%20mislukt");
      const result = await runAxe(wrapper);

      expect(result.violations.map((violation) => violation.id)).toEqual([]);
      wrapper.unmount();
    },
    AXE_TEST_TIMEOUT_MS,
  );
});
