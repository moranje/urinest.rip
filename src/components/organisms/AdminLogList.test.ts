import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminLogList from "./AdminLogList.vue";
import type { LogGroup } from "../../store/logStore";

const groups: LogGroup[] = [
  {
    fingerprint: "error-1",
    level: "error",
    module: "questionnaire",
    message: "Transition was skipped",
    count: 3,
    first_seen: "2026-06-02T09:00:00.000Z",
    last_seen: "2026-06-02T09:59:00.000Z",
    status: "open",
    resolved_in_version: null,
    note: null,
  },
  {
    fingerprint: "warn-1",
    level: "warn",
    module: "log-sink",
    message: "Persistence disabled",
    count: 1,
    first_seen: "2026-06-01T10:00:00.000Z",
    last_seen: "2026-06-01T10:00:00.000Z",
    status: "resolved",
    resolved_in_version: "3.3.1",
    note: null,
  },
];

afterEach(() => {
  vi.useRealTimers();
});

describe("AdminLogList", () => {
  it("delegates row button styling to the ActionRow primitive", () => {
    const source = readFileSync("src/components/organisms/AdminLogList.vue", "utf8");
    const firstChildCss =
      source.match(/\.group-row:first-child\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";

    expect(source).toContain("<ActionRow");
    expect(firstChildCss).toContain("border-radius");
    expect(source).not.toContain("min-height: var(--min-touch-target)");
    expect(source).not.toContain("background: var(--md-sys-color-surface-container-lowest)");
    expect(source).not.toContain(".group-row:hover");
  });

  it("renders loading and empty states", () => {
    const loading = mount(AdminLogList, {
      props: { groups: [], loading: true },
    });
    const empty = mount(AdminLogList, {
      props: { groups: [], loading: false },
    });

    expect(loading.text()).toContain("Logs laden...");
    expect(loading.find(".spinner").exists()).toBe(true);
    expect(empty.text()).toContain("Geen errors gevonden in deze periode");
    expect(empty.find(".empty-state").exists()).toBe(true);
  });

  it("renders grouped logs with badges and relative timestamps", () => {
    vi.setSystemTime(new Date("2026-06-02T10:00:00.000Z"));

    const wrapper = mount(AdminLogList, {
      props: { groups, loading: false },
    });

    expect(wrapper.findAll(".group-row")).toHaveLength(2);
    expect(wrapper.text()).toContain("ERROR");
    expect(wrapper.text()).toContain("Transition was skipped");
    expect(wrapper.text()).toContain("×3");
    expect(wrapper.text()).toContain("Laatst: 1 min geleden");
    expect(wrapper.text()).toContain("Eerst: 1 uur geleden");
    expect(wrapper.text()).toContain("Opgelost");
    expect(wrapper.find('[title="Opgelost in 3.3.1"]').exists()).toBe(true);
  });

  it("emits the selected fingerprint", async () => {
    const wrapper = mount(AdminLogList, {
      props: { groups, loading: false },
    });

    await wrapper.findAll(".group-row")[1]?.trigger("click");

    expect(wrapper.emitted("select")).toEqual([[groups[1]?.fingerprint]]);
  });
});
