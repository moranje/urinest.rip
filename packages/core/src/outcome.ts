export type LegacyOutcomeString = `redirect:${string}` | `result:${string}`;

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
