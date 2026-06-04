import { describe, expect, it } from "vitest";
import { appConfig, resolveTelemetrySource } from "./app-config";

describe("app config", () => {
  it("uses urinestrip as telemetry source fallback", () => {
    expect(resolveTelemetrySource()).toBe("urinestrip");
    expect(resolveTelemetrySource("")).toBe("urinestrip");
    expect(resolveTelemetrySource("not valid source")).toBe("urinestrip");
    expect(appConfig.telemetrySource).toBe(resolveTelemetrySource());
  });

  it("accepts consumer-owned telemetry source names", () => {
    expect(resolveTelemetrySource("huisarts.land")).toBe("huisarts.land");
    expect(resolveTelemetrySource(" CVRM-PREVENT ")).toBe("cvrm-prevent");
    expect(resolveTelemetrySource("poh.dm_care.v1")).toBe("poh.dm_care.v1");
  });
});
