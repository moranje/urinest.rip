import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router/index";
import { handleError } from "./lib/errors";
import { initErrorContext } from "./lib/error-context";
import { initLogSink } from "./lib/log-sink";
import { isSkippedViewTransition } from "./lib/view-transition";

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Global error handlers
app.config.errorHandler = (err, _instance, info) => {
  handleError(err as Error, `vue:${info}`);
};

window.addEventListener("unhandledrejection", (e) => {
  e.preventDefault();
  if (isSkippedViewTransition(e.reason)) return;
  handleError(e.reason, "unhandled-rejection");
});

window.addEventListener("error", (e) => {
  handleError(e.error ?? new Error(e.message), "window:error", {
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
  });
});

// Initialize error context, log sink, and auth
initErrorContext();
initLogSink();

import { useAuthStore } from "./store/authStore";
useAuthStore().init();

app.mount("#app");
