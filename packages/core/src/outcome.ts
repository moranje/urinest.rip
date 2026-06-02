import type { ManifestCondition, ManifestId } from "./manifest";
import { validateConditions, type ConditionAnswers } from "./conditions";

export type LegacyOutcomeString = `redirect:${string}` | `result:${string}`;

export interface OutcomeLogicRule {
  readonly id?: ManifestId;
  readonly conditions?: readonly ManifestCondition[] | null;
  readonly actionType: string;
  readonly resultKey?: ManifestId;
  readonly redirectToQuestionnaire?: ManifestId;
}

export interface OutcomeResolution {
  readonly outcome: LegacyOutcomeString | null;
  readonly ruleId: ManifestId | null;
}

export interface RedirectOutcome {
  type: "redirect";
  target: string;
  raw: LegacyOutcomeString;
}

export interface ResultOutcome {
  type: "result";
  key: string;
  raw: LegacyOutcomeString;
}

export interface NoneOutcome {
  type: "none";
  raw: null;
}

export type TypedOutcome = RedirectOutcome | ResultOutcome | NoneOutcome;

export function parseOutcome(outcome: string | null | undefined): TypedOutcome {
  if (!outcome) return { type: "none", raw: null };

  const separatorIndex = outcome.indexOf(":");
  if (separatorIndex <= 0 || separatorIndex === outcome.length - 1) {
    throw new Error(`Malformed outcome: ${outcome}`);
  }

  const type = outcome.slice(0, separatorIndex);
  const value = outcome.slice(separatorIndex + 1);
  if (type === "redirect") {
    return { type, target: value, raw: outcome as LegacyOutcomeString };
  }
  if (type === "result") {
    return { type, key: value, raw: outcome as LegacyOutcomeString };
  }

  throw new Error(`Unsupported outcome type: ${type}`);
}

export function toLegacyOutcome(outcome: TypedOutcome): LegacyOutcomeString | null {
  return outcome.type === "none" ? null : outcome.raw;
}

export function isRedirectOutcome(outcome: TypedOutcome): outcome is RedirectOutcome {
  return outcome.type === "redirect";
}

export function isResultOutcome(outcome: TypedOutcome): outcome is ResultOutcome {
  return outcome.type === "result";
}

const toOutcomeString = (rule: OutcomeLogicRule): LegacyOutcomeString | null => {
  if (
    (rule.actionType === "redirectToQuestionnaire" || rule.actionType === "redirect") &&
    rule.redirectToQuestionnaire
  ) {
    return `redirect:${rule.redirectToQuestionnaire}`;
  }

  if (rule.resultKey) {
    return `result:${rule.resultKey}`;
  }

  return null;
};

export function determineOutcome(
  answers: ConditionAnswers = {},
  resultsLogic: readonly OutcomeLogicRule[] | null | undefined,
): OutcomeResolution {
  if (!resultsLogic || resultsLogic.length === 0) {
    return { outcome: null, ruleId: null };
  }

  let bestMatch: OutcomeLogicRule | null = null;
  let highestMatchedCount = -1;

  for (const rule of resultsLogic) {
    const { isValid, matchedCount } = validateConditions(answers, rule.conditions);

    if (isValid && matchedCount > highestMatchedCount) {
      bestMatch = rule;
      highestMatchedCount = matchedCount;
    }
  }

  bestMatch ??=
    resultsLogic.find((rule) => !rule.conditions || rule.conditions.length === 0) ?? null;

  if (!bestMatch) {
    return { outcome: null, ruleId: null };
  }

  return {
    outcome: toOutcomeString(bestMatch),
    ruleId: bestMatch.id ?? null,
  };
}
