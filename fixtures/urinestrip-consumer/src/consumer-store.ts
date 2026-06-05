import {
  determineOutcome,
  type ManifestQuestion,
  type ManifestStep,
  type NormalizedResultLogicRule,
} from "@moranje/beslismodel/core";
import { createPinia, setActivePinia } from "pinia";
import type { CompiledDecisionManifest } from "@moranje/beslismodel/compiler";
import {
  createBeslismodelStore,
  type BeslismodelManifestInput,
  type BeslismodelOutcomeResult,
  type BeslismodelQuestionnaireMeta,
  type BeslismodelStorageAdapter,
} from "@moranje/beslismodel/vue";

export interface ConsumerAnswer {
  readonly value: string;
  readonly text: string;
}

interface ConsumerQuestionnaireMeta extends BeslismodelQuestionnaireMeta {
  readonly id: string;
  readonly version: string;
}

export const createMemoryStorage = (): BeslismodelStorageAdapter & {
  readonly values: Map<string, string>;
} => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
};

export const createUrinestripConsumerStore = (manifest: CompiledDecisionManifest) => {
  setActivePinia(createPinia());
  const storage = createMemoryStorage();
  const useStore = createBeslismodelStore<
    Record<string, unknown>,
    ConsumerAnswer,
    ConsumerQuestionnaireMeta,
    ManifestQuestion,
    ManifestStep,
    NormalizedResultLogicRule,
    BeslismodelOutcomeResult
  >({
    answersStorage: storage,
    answersStorageKey: "consumer-answers",
    answersTtlMs: 60_000,
    contextAliases: { role: "_role" },
    contextProvider: () => ({ role: "behandelaar" }),
    duplicateIdPolicy: "overwrite",
    loadManifest: async () =>
      manifest as unknown as BeslismodelManifestInput<Record<string, unknown>>,
    outcomeResolver: (answers, logic) =>
      determineOutcome(answers, logic) as BeslismodelOutcomeResult,
  });

  return {
    storage,
    store: useStore(),
  };
};
