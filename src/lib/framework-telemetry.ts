import type { BeslismodelTelemetryAdapter, BeslismodelTelemetryEvent } from "@beslismodel/vue";
import { persistTelemetry, type PersistTelemetryInput } from "./log-sink";

export interface SupabaseTelemetryAdapterOptions {
  readonly module?: string;
  readonly persist?: (input: PersistTelemetryInput) => void;
}

const levelForEvent = (event: BeslismodelTelemetryEvent): PersistTelemetryInput["level"] =>
  event.type.endsWith("_failed") ? "warn" : "info";

export function createSupabaseTelemetryAdapter(
  options: SupabaseTelemetryAdapterOptions = {},
): BeslismodelTelemetryAdapter {
  const module = options.module ?? "framework";
  const persist = options.persist ?? persistTelemetry;

  return {
    track(event): void {
      try {
        persist({
          module,
          message: event.type,
          level: levelForEvent(event),
          context: { ...event },
        });
      } catch {
        // Telemetry must never break a clinical decision flow.
      }
    },
  };
}
