import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import RoleToggle from "./RoleToggle.vue";
import { useRoleStore } from "../store/roleStore";

describe("RoleToggle", () => {
  let storageValues: Map<string, string>;

  beforeEach(() => {
    storageValues = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storageValues.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storageValues.set(key, value);
        },
        removeItem: (key: string) => {
          storageValues.delete(key);
        },
        clear: () => {
          storageValues.clear();
        },
      },
    });
  });

  const mountWithPinia = () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    return {
      pinia,
      wrapper: mount(RoleToggle, {
        global: { plugins: [pinia] },
      }),
    };
  };

  it("renders the role switch as a segmented radiogroup", () => {
    const { wrapper } = mountWithPinia();

    expect(wrapper.get('[role="radiogroup"]').attributes("aria-label")).toBe("Rol selectie");
    expect(wrapper.get('[role="radio"][aria-checked="true"]').text()).toContain("Arts");
  });

  it("updates the role store and local storage when triage is selected", async () => {
    const { wrapper } = mountWithPinia();
    const roleStore = useRoleStore();

    await wrapper.get('[role="radio"][aria-label="Triage"]').trigger("click");

    expect(roleStore.role).toBe("triagist");
    expect(window.localStorage.getItem("urinest-role")).toBe("triagist");
    expect(wrapper.get('[role="radio"][aria-checked="true"]').text()).toContain("Triage");
  });

  it("initializes from the stored triage role", () => {
    window.localStorage.setItem("urinest-role", "triagist");
    const { wrapper } = mountWithPinia();

    expect(wrapper.get('[role="radio"][aria-checked="true"]').text()).toContain("Triage");
  });
});
