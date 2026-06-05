import { persistTelemetry } from "./log-sink";

type WebVitalName = "CLS" | "FCP" | "INP" | "LCP";
type WebVitalRating = "good" | "needs-improvement" | "poor";

interface PerformanceEntryListLike {
  getEntries(): PerformanceEntry[];
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput?: boolean;
  value?: number;
}

interface InteractionEntry extends PerformanceEntry {
  duration: number;
  interactionId?: number;
}

let initialized = false;

const thresholds: Record<WebVitalName, readonly [number, number]> = {
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  INP: [200, 500],
  LCP: [2500, 4000],
};

function rateMetric(name: WebVitalName, value: number): WebVitalRating {
  const [good, poor] = thresholds[name];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

function roundedValue(name: WebVitalName, value: number): number {
  if (name === "CLS") return Math.round(value * 1000) / 1000;
  return Math.round(value);
}

function persistVital(name: WebVitalName, value: number): void {
  if (!Number.isFinite(value)) return;

  const rounded = roundedValue(name, value);
  persistTelemetry({
    module: "web-vitals",
    message: `web_vital.${name.toLowerCase()}`,
    context: {
      metric: name,
      rating: rateMetric(name, value),
      value: rounded,
      visibilityState: document.visibilityState,
    },
  });
}

function observe(
  type: string,
  callback: (entries: PerformanceEntry[]) => void,
): PerformanceObserver | null {
  if (typeof PerformanceObserver === "undefined") return null;

  try {
    const observer = new PerformanceObserver((list: PerformanceEntryListLike) => {
      callback(list.getEntries());
    });
    observer.observe({ buffered: true, type });
    return observer;
  } catch {
    return null;
  }
}

export function initWebVitalsTelemetry(): () => void {
  if (initialized || typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }
  initialized = true;

  let clsValue = 0;
  let latestLcp = 0;
  let maxInp = 0;
  let flushedFinalMetrics = false;

  const observers = [
    observe("paint", (entries) => {
      const fcp = entries.find((entry) => entry.name === "first-contentful-paint");
      if (fcp) persistVital("FCP", fcp.startTime);
    }),
    observe("largest-contentful-paint", (entries) => {
      const last = entries.at(-1);
      if (last) latestLcp = last.startTime;
    }),
    observe("layout-shift", (entries) => {
      for (const entry of entries as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput) clsValue += entry.value ?? 0;
      }
    }),
    observe("event", (entries) => {
      for (const entry of entries as InteractionEntry[]) {
        if ((entry.interactionId ?? 0) > 0) maxInp = Math.max(maxInp, entry.duration);
      }
    }),
  ].filter((observer): observer is PerformanceObserver => Boolean(observer));

  const flushFinalMetrics = () => {
    if (flushedFinalMetrics) return;
    flushedFinalMetrics = true;
    if (latestLcp > 0) persistVital("LCP", latestLcp);
    persistVital("CLS", clsValue);
    if (maxInp > 0) persistVital("INP", maxInp);
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") flushFinalMetrics();
  };

  window.addEventListener("pagehide", flushFinalMetrics, { once: true });
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    window.removeEventListener("pagehide", flushFinalMetrics);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    for (const observer of observers) observer.disconnect();
    initialized = false;
  };
}
