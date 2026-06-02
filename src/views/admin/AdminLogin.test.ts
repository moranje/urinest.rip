import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLogin from "./AdminLogin.vue";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  signIn: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("../../store/authStore", () => ({
  useAuthStore: () => ({ signIn: mocks.signIn }),
}));

vi.mock("../../store/toastStore", () => ({
  useToastStore: () => ({ error: mocks.toastError }),
}));

describe("AdminLogin", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.signIn.mockReset();
    mocks.toastError.mockReset();
  });

  it("delegates form controls to primitives", () => {
    const source = readFileSync("src/views/admin/AdminLogin.vue", "utf8");

    expect(source).toContain("<Input");
    expect(source).toContain("<IconButton");
    expect(source).toContain("<Notice");
    expect(source).not.toContain("<input");
    expect(source).not.toContain("show-password-toggle");
    expect(source).not.toContain(".session-expired");
    expect(source).not.toContain(".login-btn");
    expect(source).not.toContain(".field {");
  });

  it("keeps password reveal accessible", async () => {
    const wrapper = mount(AdminLogin);

    expect(wrapper.get("#password").attributes("type")).toBe("password");
    const toggle = wrapper.get('[aria-label="Wachtwoord tonen"]');
    expect(toggle.attributes("aria-pressed")).toBe("false");

    await toggle.trigger("click");

    expect(wrapper.get("#password").attributes("type")).toBe("text");
    expect(wrapper.get('[aria-label="Wachtwoord verbergen"]').attributes("aria-pressed")).toBe(
      "true",
    );
  });
});
