import { createRouter, createWebHistory } from "vue-router";
import { nextTick } from "vue";
import { useQuestionnaireStore } from "../store/questionnaireStore";
import { breadcrumbNav } from "../lib/breadcrumbs";
import { useAuthStore } from "../store/authStore";

import LandingPage from "../views/LandingPage.vue";
import ResultPage from "../views/ResultPage.vue";
import AboutPage from "../views/AboutPage.vue";
import ErrorPage from "../views/ErrorPage.vue";

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
    beforeEnter: async (
      to: import("vue-router").RouteLocationNormalized,
      _from: import("vue-router").RouteLocationNormalized,
      next: import("vue-router").NavigationGuardNext,
    ) => {
      const store = useQuestionnaireStore();

      if (store.dataReady) {
        next();
        return;
      }

      if (store.loadingPromise) {
        try {
          await store.loadingPromise;
          await nextTick();
          next();
        } catch {
          next({
            name: "Error",
            query: { message: "Kon gegevens niet laden", retry: to.fullPath },
          });
        }
        return;
      }

      if (!store.isLoading && !store.dataReady) {
        try {
          await store.loadInitialData();
          await nextTick();
          if (store.dataReady) {
            next();
          } else {
            next({ name: "Error", query: { message: "Laden mislukt", retry: to.fullPath } });
          }
        } catch {
          next({ name: "Error", query: { retry: to.fullPath } });
        }
        return;
      }

      next();
    },
  },
  {
    path: "/info/:resultKey",
    name: "Result",
    component: ResultPage,
    props: true,
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
  if (to.path === from.path) return;

  return new Promise<void>((proceed) => {
    const doc = document as Document & {
      startViewTransition: (cb: () => void | Promise<void>) => unknown;
    };
    doc.startViewTransition(() => {
      proceed();
      return new Promise<void>((commit) => {
        pendingCommit = commit;
      });
    });
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
