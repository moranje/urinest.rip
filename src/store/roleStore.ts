import { defineStore } from "pinia";
import { ref } from "vue";
import type { UserRole } from "../types";
import { breadcrumbClick } from "../lib/breadcrumbs";
import { handleError } from "../lib/errors";
import { createLogger } from "../lib/logger";
import { readStorage, writeStorage } from "../lib/storage";

const STORAGE_KEY = "urinest-role";
const log = createLogger("role");

export const useRoleStore = defineStore("role", () => {
  const stored = readStorage("local", STORAGE_KEY);
  const role = ref<UserRole>(stored === "triagist" ? "triagist" : "behandelaar");

  const setRole = (newRole: UserRole): void => {
    const previousRole = role.value;
    role.value = newRole;
    if (!writeStorage("local", STORAGE_KEY, newRole)) {
      handleError(new Error("Role storage unavailable"), "role:write-storage", { role: newRole });
    }
    if (previousRole !== newRole) {
      breadcrumbClick("role-change", { from: previousRole, to: newRole });
      log.info("role changed", { from: previousRole, to: newRole });
    }
  };

  const toggleRole = (): void => {
    setRole(role.value === "behandelaar" ? "triagist" : "behandelaar");
  };

  return { role, setRole, toggleRole };
});
