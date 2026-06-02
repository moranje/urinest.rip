import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import LogFilters from "./LogFilters.vue";
import type { LogFilters as LogFiltersType } from "../../store/logStore";

const filters: LogFiltersType = {
  hours: 24,
  level: null,
  status: "open",
};

describe("LogFilters", () => {
  it("renders filter selects through primitives", () => {
    const wrapper = mount(LogFilters, { props: { filters } });

    expect(wrapper.findAll(".select-field")).toHaveLength(3);
    expect(wrapper.findAll(".select-field__label").map((label) => label.text())).toEqual([
      "Periode",
      "Level",
      "Status",
    ]);
    expect(wrapper.get<HTMLSelectElement>("#filter-hours").element.value).toBe("24");
    expect(wrapper.get<HTMLSelectElement>("#filter-level").element.value).toBe("all");
    expect(wrapper.get<HTMLSelectElement>("#filter-status").element.value).toBe("open");
  });

  it("emits typed filter changes", async () => {
    const wrapper = mount(LogFilters, { props: { filters } });

    await wrapper.get("#filter-hours").setValue("168");
    await wrapper.get("#filter-level").setValue("error");
    await wrapper.get("#filter-level").setValue("all");
    await wrapper.get("#filter-status").setValue("resolved");

    expect(wrapper.emitted("change")).toEqual([
      [{ hours: 168 }],
      [{ level: "error" }],
      [{ level: null }],
      [{ status: "resolved" }],
    ]);
  });
});
