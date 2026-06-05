import {
  appendRedirectTrail,
  normalizeRedirectTrail,
  type ManifestId,
  type RedirectTrail,
  type RedirectTrailAppendResult,
} from "@moranje/beslismodel/core";
import { appConfig } from "../config/app-config";
import { handleError } from "./errors";
import { readStorage, removeStorage, writeStorage } from "./storage";

const storageArea = "session";

const parseStoredTrail = (raw: string | null): RedirectTrail | null => {
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Partial<RedirectTrail>;
  if (
    !Array.isArray(parsed.flows) ||
    parsed.flows.some((flow) => typeof flow !== "string") ||
    typeof parsed.updatedAt !== "number"
  ) {
    return null;
  }
  return { flows: parsed.flows, updatedAt: parsed.updatedAt };
};

export const clearStoredRedirectTrail = (): void => {
  removeStorage(storageArea, appConfig.storage.redirectChainKey);
};

export const readStoredRedirectTrail = (
  currentQuestionnaireId: ManifestId,
  now = Date.now(),
): RedirectTrail => {
  try {
    const parsed = parseStoredTrail(readStorage(storageArea, appConfig.storage.redirectChainKey));
    if (!parsed) clearStoredRedirectTrail();
    return normalizeRedirectTrail(parsed, currentQuestionnaireId, {
      now,
      ttlMs: appConfig.storage.redirectChainTtlMs,
    });
  } catch (error) {
    clearStoredRedirectTrail();
    handleError(error, "questionnaire:redirect-chain-read", { flowId: currentQuestionnaireId });
    return normalizeRedirectTrail(null, currentQuestionnaireId, { now });
  }
};

export const writeStoredRedirectTrail = (trail: RedirectTrail): void => {
  writeStorage(storageArea, appConfig.storage.redirectChainKey, JSON.stringify(trail));
};

export const appendStoredRedirectTrail = (
  currentQuestionnaireId: ManifestId,
  targetQuestionnaireId: ManifestId,
  now = Date.now(),
): RedirectTrailAppendResult => {
  const currentTrail = readStoredRedirectTrail(currentQuestionnaireId, now);
  const result = appendRedirectTrail(currentTrail, targetQuestionnaireId, { now });
  if (result.type === "ok") {
    writeStoredRedirectTrail(result.trail);
  }
  return result;
};
