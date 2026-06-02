import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearBreadcrumbs } from "../breadcrumbs";
import { clearFlowTrail, recordFlowStep } from "../flow-trail";
import {
  flushLogs,
  flushViaBeaconForTests,
  initLogSink,
  persistError,
  persistTelemetry,
  resetLogSinkForTests,
} from "../log-sink";

const rpcMock = vi.fn();

vi.mock("../supabase/client", () => ({
  getSupabase: () => ({
    rpc: rpcMock,
  }),
}));

function installStorage(name: "localStorage" | "sessionStorage") {
  const values = new Map<string, string>();
  const storage = {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  };
  Object.defineProperty(window, name, { value: storage, configurable: true });
  vi.stubGlobal(name, storage);
  return storage;
}

function persistSampleError(context = "test:error"): void {
  persistError({
    context,
    userMessage: "Er ging iets mis.",
    errorClass: "Error",
    level: "error",
  });
}

describe("log-sink", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    installStorage("localStorage");
    installStorage("sessionStorage");
    resetLogSinkForTests();
    clearBreadcrumbs();
    clearFlowTrail();
    rpcMock.mockReset();
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
  });

  afterEach(() => {
    resetLogSinkForTests();
  });

  it("persists diagnostic info events", async () => {
    rpcMock.mockResolvedValue({ error: null });

    persistTelemetry({
      module: "questionnaire-store",
      message: "flow.versions",
      context: { flow: "strip" },
    });
    await flushLogs();

    expect(rpcMock).toHaveBeenCalledWith("insert_app_logs", {
      p_logs: [
        expect.objectContaining({
          level: "info",
          module: "questionnaire-store",
          message: "flow.versions",
          session_id: expect.stringMatching(/^session_[a-f0-9]{8}$/),
          source: "urinestrip",
        }),
      ],
    });
  });

  it("scrubs PHI from persisted error payloads", async () => {
    rpcMock.mockResolvedValue({ error: null });

    persistError({
      context: "test:scrub",
      devDetail: "Bearer secret-token voor arts@example.org op 2026-06-02",
      errorClass: "Error",
      extraContext: {
        bsn: "123456782",
        email: "arts@example.org",
        tokenUrl: "https://example.test/log?access_token=secret-token",
      },
      level: "error",
      stack: "Error: arts@example.org\n    at test (2026-06-02)",
      userMessage: "Fout voor arts@example.org met BSN 123456782",
    });
    await flushLogs();

    const payload = rpcMock.mock.calls[0]?.[1]?.p_logs?.[0] as
      | {
          context: Record<string, unknown>;
          detail: Record<string, unknown>;
          message: string;
        }
      | undefined;
    expect(payload).toBeDefined();
    const serialized = JSON.stringify({
      context: payload?.context,
      detail: payload?.detail,
      message: payload?.message,
    });

    expect(serialized).not.toContain("arts@example.org");
    expect(serialized).not.toContain("123456782");
    expect(serialized).not.toContain("2026-06-02");
    expect(serialized).not.toContain("secret-token");
    expect(payload?.message).toContain("***SCRUBBED-EMAIL***");
    expect(payload?.message).toContain("***SCRUBBED-BSN***");
    expect(payload?.detail.devDetail).toContain("Bearer ***SCRUBBED-TOKEN***");
    expect(payload?.context.tokenUrl).toContain("access_token=***SCRUBBED-TOKEN***");
    expect(Number(payload?.context.scrub_hits_total)).toBeGreaterThanOrEqual(6);
  });

  it("sets a circuit-breaker flag after repeated transient failures", async () => {
    rpcMock.mockResolvedValue({ error: { message: "network", code: "503" } });

    persistSampleError();
    await flushLogs();
    await flushLogs();
    await flushLogs();

    expect(localStorage.getItem("log_sink_down")).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
  ])("disables persistence immediately for permanent HTTP %s failures", async (status, message) => {
    rpcMock.mockResolvedValue({ error: { status, message } });

    persistSampleError(`test:http-${status}`);
    await flushLogs();
    await flushLogs();

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("log_sink_down")).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it.each([
    [429, "rate limited"],
    [503, "service unavailable"],
  ])("requeues logs for transient HTTP %s failures", async (status, message) => {
    rpcMock
      .mockResolvedValueOnce({ error: { status, message } })
      .mockResolvedValueOnce({ error: null });

    persistSampleError(`test:http-${status}`);
    await flushLogs();
    await flushLogs();

    expect(rpcMock).toHaveBeenCalledTimes(2);
    expect(rpcMock.mock.calls[1]?.[1]).toEqual({
      p_logs: [expect.objectContaining({ module: `test:http-${status}` })],
    });
    expect(localStorage.getItem("log_sink_down")).toBeNull();
  });

  it("flushes buffered logs through sendBeacon on unload fallback", () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { ...navigator, sendBeacon });

    persistSampleError("test:beacon");
    flushViaBeaconForTests();

    expect(sendBeacon).toHaveBeenCalledWith(
      "https://example.supabase.co/rest/v1/rpc/insert_app_logs?apikey=anon-key",
      expect.any(Blob),
    );
  });

  it("does not persist in dev unless explicitly enabled", async () => {
    vi.stubEnv("MODE", "development");
    vi.stubEnv("DEV", true);

    initLogSink();
    persistSampleError("test:dev-disabled");
    await flushLogs();

    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("persists in dev when explicitly enabled", async () => {
    vi.stubEnv("MODE", "development");
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_ENABLE_LOG_PERSISTENCE", "true");
    rpcMock.mockResolvedValue({ error: null });

    initLogSink();
    persistSampleError("test:dev-enabled");
    await flushLogs();

    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it("persists only sanitized flow trail context", async () => {
    rpcMock.mockResolvedValue({ error: null });
    recordFlowStep({
      flowId: "bacteriurie",
      version: "1",
      stepId: "risk",
      questionId: "q1",
      branch: "q1-o2",
      role: "behandelaar",
    });

    persistSampleError("test:flow-trail");
    await flushLogs();

    const payload = rpcMock.mock.calls[0]?.[1];
    const serialized = JSON.stringify(payload);
    expect(serialized).toContain("flow_trail");
    expect(serialized).toContain("flow_");
    expect(serialized).toContain("question_");
    expect(serialized).not.toContain("bacteriurie");
    expect(serialized).not.toContain("q1-o2");
  });

  it("keeps persistence disabled after a breaker reload", async () => {
    localStorage.setItem("log_sink_down", "2026-06-01T00:00:00.000Z");

    initLogSink();
    persistSampleError("test:breaker-reload");
    await flushLogs();

    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("requeues buffered logs after thrown offline flush errors", async () => {
    rpcMock.mockRejectedValueOnce(new Error("network down")).mockResolvedValueOnce({ error: null });

    persistSampleError("test:requeue");
    await flushLogs();
    await flushLogs();

    expect(rpcMock).toHaveBeenCalledTimes(2);
    expect(rpcMock.mock.calls[1]?.[1]).toEqual({
      p_logs: [expect.objectContaining({ module: "test:requeue" })],
    });
  });
});
