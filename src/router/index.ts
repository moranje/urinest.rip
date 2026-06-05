import { createRouter, createWebHistory } from "vue-router";
import { nextTick } from "vue";
import { createBeslismodelDataReadyGuard } from "@moranje/beslismodel/vue";
import { useQuestionnaireStore } from "../store/questionnaireStore";
import { breadcrumbNav } from "../lib/breadcrumbs";
import { handleError } from "../lib/errors";
import { AUTH_SESSION_EXPIRED_EVENT } from "../lib/auth-events";
import { observeViewTransition } from "../lib/view-transition";
import { useAuthStore } from "../store/authStore";
import { shouldUseRouteViewTransition } from "./view-transition-policy";

import LandingPage from "../views/LandingPage.vue";
import ResultPage from "../views/ResultPage.vue";
import AboutPage from "../views/AboutPage.vue";
import ErrorPage from "../views/ErrorPage.vue";

const clinicalDataReadyGuard = createBeslismodelDataReadyGuard({
  afterLoad: () => nextTick(),
  onFailure: (failure) => {
    if (failure.reason === "load-error" && failure.phase === "pending") {
      return {
        name: "Error",
        query: { message: "Kon gegevens niet laden", retry: failure.to.fullPath },
      };
    }
    if (failure.reason === "load-error") {
      return { name: "Error", query: { retry: failure.to.fullPath } };
    }
    return {
      name: "Error",
      query: { message: "Laden mislukt", retry: failure.to.fullPath },
    };
  },
  useStore: useQuestionnaireStore,
});

const routes = [
  {
    path: "/",
    name: "Landing",
    component: LandingPage,
  },
  {
    path: "/questionnaire/:id",
    name: "Questionnaire",
    component: () => import("../views/QuestionnairePage.vue").then((m) => m.default),
    props: true,
    beforeEnter: clinicalDataReadyGuard,
  },
  {
    path: "/info/:resultKey",
    name: "Result",
    component: ResultPage,
    props: true,
    beforeEnter: clinicalDataReadyGuard,
  },
  { path: "/over", name: "About", component: AboutPage },
  { path: "/error", name: "Error", component: ErrorPage },
  {
    path: "/admin/login",
    name: "AdminLogin",
    component: () => import("../views/admin/AdminLogin.vue"),
  },
  {
    path: "/admin/logs",
    name: "AdminLogs",
    component: () => import("../views/admin/LogDashboard.vue"),
    meta: { requiresAuth: true },
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      next({ name: "AdminLogin" });
      return;
    }
  }
  next();
});

if (typeof window !== "undefined") {
  window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, () => {
    const current = router.currentRoute.value;
    if (!current.path.startsWith("/admin") || current.name === "AdminLogin") return;

    void router
      .push({
        name: "AdminLogin",
        query: { expired: "1", redirect: current.fullPath },
      })
      .catch((error: unknown) => handleError(error, "router:auth-session-expired"));
  });
}

// -- View Transitions for route changes --
//
// Native View Transitions API gives us a smooth cross-fade between routes
// without Vue's <transition> mode="out-in", which conflicts with the API and
// produces `getNextHostNode` crashes when a component updates mid-swap.
//
// Pattern: beforeResolve returns a Promise that resolves only when the
// browser is ready to commit. Inside startViewTransition's callback we let
// the guard proceed (so Vue swaps the component) and wait one tick for the
// DOM to flush before resolving the inner promise — that's when the browser
// captures the "new" snapshot and animates between old and new.

function supportsViewTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as { startViewTransition?: unknown }).startViewTransition === "function"
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

let pendingCommit: (() => void) | null = null;

router.beforeResolve((to, from) => {
  if (!supportsViewTransitions()) return;
  if (prefersReducedMotion()) return;
  if (!shouldUseRouteViewTransition(to, from)) return;

  return new Promise<void>((proceed) => {
    const doc = document as Document & {
      startViewTransition: (cb: () => void | Promise<void>) => unknown;
    };
    const transition = doc.startViewTransition(() => {
      proceed();
      return new Promise<void>((commit) => {
        pendingCommit = commit;
      });
    });
    observeViewTransition(transition, (error) => handleError(error, "router:view-transition"));
  });
});

router.afterEach((to, from) => {
  breadcrumbNav(from.path, to.path);

  if (pendingCommit) {
    nextTick().then(() => {
      pendingCommit?.();
      pendingCommit = null;
    });
  }
});

export default router;
