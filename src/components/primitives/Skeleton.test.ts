import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Skeleton from "./Skeleton.vue";

describe("Skeleton primitive", () => {
  it("renders with default line variant", () => {
    const wrapper = mount(Skeleton);
    expect(wrapper.classes()).toContain("skeleton--line");
  });

  it("renders title variant", () => {
    const wrapper = mount(Skeleton, { props: { variant: "title" } });
    expect(wrapper.classes()).toContain("skeleton--title");
  });

  it("renders option variant", () => {
    const wrapper = mount(Skeleton, { props: { variant: "option" } });
    expect(wrapper.classes()).toContain("skeleton--option");
  });

  it("has aria-hidden=true so it is not announced", () => {
    const wrapper = mount(Skeleton);
    expect(wrapper.attributes("aria-hidden")).toBe("true");
  });

  it("applies width/height props as inline style", () => {
    const wrapper = mount(Skeleton, { props: { width: "50%", height: "20px" } });
    const style = (wrapper.element as HTMLElement).style;
    expect(style.width).toBe("50%");
    expect(style.height).toBe("20px");
  });
});
