import { readFileSync } from "node:fs";
import { createPinia, setActivePinia, type Pinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ToastContainer from "./ToastContainer.vue";
import { useToastStore } from "../store/toastStore";

function createToastPinia(): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

describe("ToastContainer", () => {
  it("delegates toast visuals to the Toast molecule", () => {
    const source = readFileSync("src/components/ToastContainer.vue", "utf8");

    expect(source).toContain("<ToastMessage");
    expect(source).toContain('./molecules/Toast.vue"');
    expect(source).not.toContain("<Notice");
    expect(source).not.toContain("<IconButton");
    expect(source).not.toContain("toast--success");
    expect(source).not.toContain("toast--error");
    expect(source).not.toContain("toast--warning");
    expect(source).not.toContain("toast--info");
    expect(source).not.toContain("toast-content");
    expect(source).not.toContain('class="toast-close"');
    expect(source).not.toContain(".toast-close {");
    expect(source).not.toContain(".toast-close:hover");
  });

  it("renders dismissible toasts and closes them from the icon button", async () => {
    const pinia = createToastPinia();
    const toastStore = useToastStore();
    toastStore.addToast("info", "Nieuwe melding", { duration: 0 });

    const wrapper = mount(ToastContainer, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.get('[role="status"]').text()).toContain("Nieuwe melding");

    await wrapper.get('[data-testid="toast-close"]').trigger("click");

    expect(toastStore.toasts).toEqual([]);
  });
});
