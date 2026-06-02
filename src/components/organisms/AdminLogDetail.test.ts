import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminLogDetail from "./AdminLogDetail.vue";
import { useLogStore, type LogEvent, type LogGroup } from "../../store/logStore";
import { useToastStore } from "../../store/toastStore";

const group: LogGroup = {
  fingerprint: "fp-1",
  level: "error",
  module: "questionnaire",
  message: "Transition was skipped",
  count: 2,
  first_seen: "2026-06-02T09:00:00.000Z",
  last_seen: "2026-06-02T09:59:00.000Z",
  status: "open",
  resolved_in_version: null,
  note: null,
};

const event: LogEvent = {
  id: 42,
  level: "error",
  module: "questionnaire",
  message: "Transition was skipped",
  detail: {
    stack: "Error: Transition was skipped\n    at router.ts:10:5",
    context: "questionnaire redirect",
    devDetail: "Router transition guard skipped",
    errorClass: "Error",
    browser: "Chrome",
    os: "macOS",
    deviceType: "desktop",
    appVersion: "3.3.1",
    env: "dev",
    sourceLocation: { file: "src/router.ts", line: 10, column: 5 },
    breadcrumbs: [
      {
        type: "flow",
        message: "Open urinestrip",
        timestamp: "2026-06-02T09:58:30.000Z",
        count: 2,
      },
    ],
  },
  context: null,
  session_id: "session-123456",
  url: "/questionnaire/strip",
  created_at: "2026-06-02T09:59:00.000Z",
};

function mountDetail(overrides: { group?: LogGroup; events?: LogEvent[]; loading?: boolean } = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const logStore = useLogStore();
  const toastStore = useToastStore();
  const resolveGroup = vi.spyOn(logStore, "resolveGroup").mockResolvedValue(undefined);
  const suppressGroup = vi.spyOn(logStore, "suppressGroup").mockResolvedValue(undefined);
  const unresolveGroup = vi.spyOn(logStore, "unresolveGroup").mockResolvedValue(undefined);
  const toastSuccess = vi.spyOn(toastStore, "success").mockImplementation(() => 1);

  const wrapper = mount(AdminLogDetail, {
    props: {
      group: overrides.group ?? group,
      events: overrides.events ?? [event],
      loading: overrides.loading ?? false,
    },
    global: {
      plugins: [pinia],
      stubs: {
        Icon: true,
        StackTrace: {
          props: ["stack"],
          template: '<pre class="stack-trace-stub">{{ stack }}</pre>',
        },
      },
    },
  });

  return { wrapper, resolveGroup, suppressGroup, unresolveGroup, toastSuccess };
}

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("AdminLogDetail", () => {
  it("renders log context and emits back navigation", async () => {
    const { wrapper } = mountDetail();

    expect(wrapper.get("h2").text()).toBe("Transition was skipped");
    expect(wrapper.text()).toContain("questionnaire redirect");
    expect(wrapper.text()).toContain("Router transition guard skipped");
    expect(wrapper.text()).toContain("src/router.ts:10:5");
    expect(wrapper.get(".stack-trace-stub").text()).toContain("Transition was skipped");
    expect(wrapper.text()).toContain("Breadcrumbs (1)");
    expect(wrapper.text()).toContain("Events (2)");

    await wrapper.get(".back-btn").trigger("click");

    expect(wrapper.emitted("back")).toHaveLength(1);
  });

  it("resolves an open group with a required version", async () => {
    const { wrapper, resolveGroup, toastSuccess } = mountDetail();

    await wrapper.get(".action-resolve").trigger("click");
    const confirm = wrapper.get(".resolve-input-row .action-resolve");
    expect(confirm.attributes("disabled")).toBeDefined();

    await wrapper.get("#resolve-version-input").setValue("3.3.2");
    await confirm.trigger("click");

    expect(resolveGroup).toHaveBeenCalledWith("fp-1", "3.3.2");
    expect(toastSuccess).toHaveBeenCalledWith("Error gemarkeerd als opgelost");
    expect(wrapper.emitted("resolved")).toHaveLength(1);
  });

  it("suppresses open groups and unmarks resolved groups", async () => {
    const open = mountDetail();
    await open.wrapper.get(".action-suppress").trigger("click");

    expect(open.suppressGroup).toHaveBeenCalledWith("fp-1");
    expect(open.toastSuccess).toHaveBeenCalledWith("Error onderdrukt");
    expect(open.wrapper.emitted("resolved")).toHaveLength(1);

    const resolved = mountDetail({
      group: { ...group, status: "resolved", resolved_in_version: "3.3.1" },
    });
    await resolved.wrapper.get(".action-btn").trigger("click");

    expect(resolved.unresolveGroup).toHaveBeenCalledWith("fp-1");
    expect(resolved.toastSuccess).toHaveBeenCalledWith("Markering opgeheven");
    expect(resolved.wrapper.emitted("resolved")).toHaveLength(1);
  });

  it("exports a compact markdown prompt to the clipboard", async () => {
    vi.useFakeTimers();
    const { wrapper } = mountDetail();

    await wrapper.get(".export-btn").trigger("click");
    await Promise.resolve();

    const writeText = navigator.clipboard.writeText as ReturnType<typeof vi.fn>;
    expect(writeText).toHaveBeenCalledTimes(1);
    const markdown = writeText.mock.calls[0]?.[0] as string;
    expect(markdown).toContain("# ERROR: Transition was skipped");
    expect(markdown).toContain("| **Module** | `questionnaire` |");
    expect(markdown).toContain("| **Fingerprint** | `fp-1` |");
    expect(markdown).toContain("## Stack trace");
    expect(markdown).toContain("## Breadcrumbs (1)");
    expect(markdown).toContain("## Recente events (1 van 1)");
    expect(wrapper.get(".export-btn").text()).toContain("Gekopieerd!");

    await vi.advanceTimersByTimeAsync(2000);
    expect(wrapper.get(".export-btn").text()).toContain("Kopieer als markdown");
  });
});
