import { readFileSync } from "node:fs";
import { mount, type VueWrapper } from "@vue/test-utils";
import axe from "axe-core";
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

async function runAxe(wrapper: VueWrapper) {
  const landmark = document.createElement("main");
  landmark.id = "admin-login-axe-root";
  landmark.appendChild(wrapper.element);
  document.body.appendChild(landmark);
  try {
    return await axe.run(landmark, {
      runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
    });
  } finally {
    document.body.removeChild(landmark);
  }
}

describe("AdminLogin", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.signIn.mockReset();
    mocks.toastError.mockReset();
  });

  it("delegates form controls to primitives", () => {
    const source = readFileSync("src/views/admin/AdminLogin.vue", "utf8");

    expect(source).toContain("<Input");
    expect(source).toContain("<Card");
    expect(source).toContain("<IconButton");
    expect(source).toContain("<Notice");
    expect(source).not.toContain("<input");
    expect(source).not.toContain("show-password-toggle");
    expect(source).not.toContain(".session-expired");
    expect(source).not.toContain(".login-btn");
    expect(source).not.toContain(".field {");
  });

  it("delegates login shell styling to Card while keeping form semantics", () => {
    const wrapper = mount(AdminLogin);
    const source = readFileSync("src/views/admin/AdminLogin.vue", "utf8");
    const loginCardCss = source.match(/\.login-card\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body;

    expect(wrapper.get(".login-card").classes()).toContain("card--outlined");
    expect(wrapper.find("form.login-form").exists()).toBe(true);
    expect(source).toContain('variant="outlined"');
    expect(loginCardCss).not.toContain("background:");
    expect(loginCardCss).not.toContain("border:");
    expect(loginCardCss).not.toContain("border-radius:");
    expect(loginCardCss).not.toContain("padding:");
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

  it("exposes password-manager hints and validation state through the Input primitive", async () => {
    const wrapper = mount(AdminLogin);
    const email = wrapper.get("#email");
    const password = wrapper.get("#password");

    expect(email.attributes("autocomplete")).toBe("username webauthn");
    expect(email.attributes("inputmode")).toBe("email");
    expect(email.attributes("enterkeyhint")).toBe("next");
    expect(password.attributes("autocomplete")).toBe("current-password");
    expect(password.attributes("enterkeyhint")).toBe("go");

    await wrapper.get("form").trigger("submit");

    expect(wrapper.get("#email").attributes("aria-invalid")).toBe("true");
    expect(wrapper.get("#email").attributes("aria-describedby")).toBe("email-error");
    expect(wrapper.get("#email-error").attributes("role")).toBe("alert");
    expect(wrapper.get("#password").attributes("aria-invalid")).toBe("true");
    expect(wrapper.get("#password").attributes("aria-describedby")).toBe("password-error");
    expect(wrapper.get("#password-error").attributes("role")).toBe("alert");
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("has no axe violations on the admin login route", async () => {
    const wrapper = mount(AdminLogin, { attachTo: document.body });
    const result = await runAxe(wrapper);

    expect(result.violations.map((violation) => violation.id)).toEqual([]);
    wrapper.unmount();
  });
});
