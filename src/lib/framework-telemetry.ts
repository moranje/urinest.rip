import type {
  BeslismodelTelemetryAdapter,
  BeslismodelTelemetryEvent,
} from "@moranje/beslismodel/vue";
import { persistTelemetry, type PersistTelemetryInput } from "./log-sink";

export interface SupabaseTelemetryAdapterOptions {
  readonly module?: string;
  readonly persist?: (input: PersistTelemetryInput) => void;
}

const levelForEvent = (event: BeslismodelTelemetryEvent): PersistTelemetryInput["level"] =>
  event.type.endsWith("_failed") ? "warn" : "info";

const contextForEvent = (event: BeslismodelTelemetryEvent): Record<string, unknown> => {
  switch (event.type) {
    case "manifest.loaded":
      return {
        type: event.type,
        storeId: event.storeId,
        questionnaireCount: event.questionnaireCount,
      };
    case "manifest.load_failed":
    case "answers.persist_failed":
    case "answers.restore_failed":
      return {
        type: event.type,
        phase: event.phase,
        storeId: event.storeId,
        errorClass: event.errorClass,
      };
    case "conditions.validate_failed":
      return {
        type: event.type,
        phase: event.phase,
        storeId: event.storeId,
        questionnaireId: event.questionnaireId,
        conditionCount: event.conditionCount,
        errorClass: event.errorClass,
      };
    case "outcome.resolve_failed":
      return {
        type: event.type,
        phase: event.phase,
        storeId: event.storeId,
        questionnaireId: event.questionnaireId,
        logicCount: event.logicCount,
        errorClass: event.errorClass,
      };
  }
};

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
          context: contextForEvent(event),
        });
      } catch {
        // Telemetry must never break a clinical decision flow.
      }
    },
  };
}
