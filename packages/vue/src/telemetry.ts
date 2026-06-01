export type BeslismodelTelemetryEvent =
  | {
      readonly type: "manifest.loaded";
      readonly storeId: string;
      readonly questionnaireCount: number;
    }
  | {
      readonly type: "manifest.load_failed";
      readonly storeId: string;
      readonly phase: "manifest.load";
      readonly errorClass: string;
    }
  | {
      readonly type: "answers.persist_failed" | "answers.restore_failed";
      readonly storeId: string;
      readonly phase: "answers.persist" | "answers.restore";
      readonly errorClass: string;
    }
  | {
      readonly type: "conditions.validate_failed";
      readonly storeId: string;
      readonly phase: "conditions.validate";
      readonly questionnaireId: string;
      readonly conditionCount: number;
      readonly errorClass: string;
    }
  | {
      readonly type: "outcome.resolve_failed";
      readonly storeId: string;
      readonly phase: "outcome.resolve";
      readonly questionnaireId: string;
      readonly logicCount: number;
      readonly errorClass: string;
    };

export interface BeslismodelTelemetryAdapter {
  track(event: BeslismodelTelemetryEvent): void;
}

export const noopTelemetryAdapter: BeslismodelTelemetryAdapter = Object.freeze({
  track: () => undefined,
});
