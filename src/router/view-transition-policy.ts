import type { RouteLocationNormalized } from "vue-router";

const clinicalRouteNames = new Set(["Questionnaire", "Result"]);

export function shouldUseRouteViewTransition(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): boolean {
  if (to.path === from.path) return false;
  if (clinicalRouteNames.has(String(to.name ?? ""))) return false;
  if (clinicalRouteNames.has(String(from.name ?? ""))) return false;
  return true;
}
