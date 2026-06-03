import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import AdminTemplate from "./AdminTemplate.vue";
import type { LogEvent, LogFilters, LogGroup } from "../../store/logStore";

const filters: LogFilters = {
  hours: 24,
  level: null,
  status: "open",
};

const group: LogGroup = {
  fingerprint: "abc123",
  level: "error",
  module: "questionnaire",
  message: "Transition failed",
  count: 3,
  first_seen: "2026-06-01T08:00:00Z",
  last_seen: "2026-06-01T09:00:00Z",
  status: "open",
  resolved_in_version: null,
  note: null,
};

const event: LogEvent = {
  id: 1,
  level: "error",
  module: "questionnaire",
  message: "Transition failed",
  detail: {},
  context: null,
  session_id: "session",
  url: "/questionnaire/strip",
  created_at: "2026-06-01T09:00:00Z",
};

const buttonStub = {
  emits: ["click"],
  template: `<button class="button-stub" type="button" @click="$emit('click')"><slot /></button>`,
};

const logFiltersStub = {
  props: ["filters"],
  emits: ["change"],
  template: `
    <form class="log-filters-stub" :data-hours="filters.hours">
      <button class="filters-change" type="button" @click="$emit('change', { hours: 1 })">
        Filter
      </button>
    </form>
  `,
};

const adminLogListStub = {
  props: ["groups", "loading"],
  emits: ["select"],
  template: `
    <section class="admin-log-list-stub" :data-count="groups.length" :data-loading="String(loading)">
      <button class="select-group" type="button" @click="$emit('select', groups[0].fingerprint)">
        Select
      </button>
    </section>
  `,
};

const adminLogDetailStub = {
  props: ["group", "events", "loading"],
  emits: ["closeDetail", "resolved"],
  template: `
    <section
      class="admin-log-detail-stub"
      :data-fingerprint="group.fingerprint"
      :data-event-count="events.length"
      :data-loading="String(loading)"
    >
      <button class="detail-close" type="button" @click="$emit('closeDetail')">Close</button>
      <button class="detail-resolved" type="button" @click="$emit('resolved')">Resolved</button>
    </section>
  `,
};

function mountTemplate(overrides: Partial<InstanceType<typeof AdminTemplate>["$props"]> = {}) {
  return mount(AdminTemplate, {
    props: {
      groups: [group],
      events: [event],
      filters,
      loading: false,
      loadingEvents: false,
      selectedGroup: null,
      sinkDownAt: null,
      error: null,
      ...overrides,
    },
    global: {
      stubs: {
        AdminLogDetail: adminLogDetailStub,
        AdminLogList: adminLogListStub,
        Button: buttonStub,
        LogFilters: logFiltersStub,
      },
    },
  });
}

describe("AdminTemplate", () => {
  it("delegates warning and error banners to the Notice molecule", () => {
    const source = readFileSync("src/components/templates/AdminTemplate.vue", "utf8");
    const bannerCss =
      source.match(
        /\.admin-template__warning,\s*\n\.admin-template__error\s*\{(?<body>[\s\S]*?)\n\}/,
      )?.groups?.body ?? "";

    expect(source).toContain("<Notice");
    expect(bannerCss).toContain("margin: var(--spacing-md) 0");
    expect(bannerCss).not.toContain("background");
    expect(bannerCss).not.toContain("padding");
    expect(bannerCss).not.toContain("border-radius");
  });

  it("renders list mode with filters, banners, and sign-out action", async () => {
    const wrapper = mountTemplate({
      sinkDownAt: "2026-06-01T09:00:00Z",
      error: "Logs laden mislukt",
    });

    expect(wrapper.get("h1").text()).toBe("Error Dashboard");
    expect(wrapper.get(".log-filters-stub").attributes("data-hours")).toBe("24");
    expect(wrapper.get(".admin-template__warning").attributes("role")).toBe("status");
    expect(wrapper.get(".admin-template__warning").text()).toContain("Log-persistentie");
    expect(wrapper.get(".admin-template__error").attributes("role")).toBe("alert");
    expect(wrapper.get(".admin-log-list-stub").attributes("data-count")).toBe("1");

    await wrapper.findAll(".button-stub")[0]?.trigger("click");
    await wrapper.get(".filters-change").trigger("click");
    await wrapper.get(".admin-template__warning .button-stub").trigger("click");
    await wrapper.get(".select-group").trigger("click");

    expect(wrapper.emitted("signOut")).toHaveLength(1);
    expect(wrapper.emitted("filtersChange")?.[0]).toEqual([{ hours: 1 }]);
    expect(wrapper.emitted("clearSinkStatus")).toHaveLength(1);
    expect(wrapper.emitted("selectGroup")?.[0]).toEqual(["abc123"]);
  });

  it("renders detail mode and relays detail events", async () => {
    const wrapper = mountTemplate({
      selectedGroup: group,
      loadingEvents: true,
    });

    expect(wrapper.find(".log-filters-stub").exists()).toBe(false);
    expect(wrapper.get(".admin-log-detail-stub").attributes("data-fingerprint")).toBe("abc123");
    expect(wrapper.get(".admin-log-detail-stub").attributes("data-event-count")).toBe("1");
    expect(wrapper.get(".admin-log-detail-stub").attributes("data-loading")).toBe("true");

    await wrapper.get(".detail-close").trigger("click");
    await wrapper.get(".detail-resolved").trigger("click");

    expect(wrapper.emitted("closeDetail")).toHaveLength(1);
    expect(wrapper.emitted("resolved")).toHaveLength(1);
  });
});
