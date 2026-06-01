import type { ManifestCondition } from "./manifest";

export type ConditionAnswers = Readonly<Record<string, unknown>>;

export interface ConditionValidationResult {
  readonly isValid: boolean;
  readonly matchedCount: number;
}

const hasValue = (value: unknown): boolean => value !== undefined && value !== null;

const answerValue = (answer: unknown): unknown => {
  if (Array.isArray(answer)) {
    return answer.map((item) =>
      typeof item === "object" && item !== null && "value" in item
        ? (item as { value?: unknown }).value
        : item,
    );
  }

  if (typeof answer === "object" && answer !== null && "value" in answer) {
    return (answer as { value?: unknown }).value;
  }

  return answer;
};

const stringEquals = (left: unknown, right: unknown): boolean => String(left) === String(right);

export function evaluateCondition(
  answers: ConditionAnswers,
  condition: ManifestCondition,
): boolean {
  const answer = answers[condition.questionId];
  if (!hasValue(answer)) return false;

  const value = answerValue(answer);
  switch (condition.operator) {
    case "equals":
      return stringEquals(value, condition.value);
    case "not_equals":
      return !stringEquals(value, condition.value);
    case "in":
      return (
        Array.isArray(condition.value) && condition.value.some((item) => stringEquals(item, value))
      );
    case "not_in":
      return (
        Array.isArray(condition.value) && !condition.value.some((item) => stringEquals(item, value))
      );
    case "includes":
      return Array.isArray(value) && value.some((item) => stringEquals(item, condition.value));
    case "not_includes":
      return Array.isArray(value) && !value.some((item) => stringEquals(item, condition.value));
    default:
      return false;
  }
}

export function validateConditions(
  answers: ConditionAnswers = {},
  conditions: readonly ManifestCondition[] | null | undefined,
): ConditionValidationResult {
  if (!conditions || conditions.length === 0) {
    return { isValid: true, matchedCount: 0 };
  }

  for (const condition of conditions) {
    if (!evaluateCondition(answers, condition)) {
      return { isValid: false, matchedCount: 0 };
    }
  }

  return { isValid: true, matchedCount: conditions.length };
}
