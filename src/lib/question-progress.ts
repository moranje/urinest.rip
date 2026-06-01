import type { Condition } from "../types";

interface ProgressQuestion {
  id: string;
  conditions?: Condition[];
}

interface ProgressQuestionnaire {
  questionIds?: string[];
  questions?: ProgressQuestion[];
}

export interface QuestionProgressInput {
  questionnaire: ProgressQuestionnaire | null | undefined;
  currentQuestionId: string | null;
  questionHistory: string[];
  answers?: Record<string, unknown>;
}

export interface QuestionProgress {
  value: number;
  max: number;
  label: string;
  text: string;
}

const hasOwn = (obj: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

const answerValues = (answer: unknown): unknown[] => {
  if (Array.isArray(answer)) return answer.flatMap((item) => answerValues(item));
  if (typeof answer === "object" && answer !== null && "value" in answer) {
    return [(answer as { value: unknown }).value];
  }
  return [answer];
};

const conditionCanStillMatch = (
  answers: Record<string, unknown>,
  condition: Condition,
): boolean => {
  if (!hasOwn(answers, condition.questionId)) return true;

  const values = answerValues(answers[condition.questionId]);
  switch (condition.operator) {
    case "equals":
    case "includes":
      return values.some((value) => value === condition.value);
    case "not_equals":
    case "not_includes":
      return values.every((value) => value !== condition.value);
    default:
      return true;
  }
};

const orderedQuestionIds = (questionnaire: ProgressQuestionnaire): string[] => {
  if (questionnaire.questionIds?.length) return questionnaire.questionIds;
  return questionnaire.questions?.map((question) => question.id) ?? [];
};

export const getQuestionProgress = ({
  questionnaire,
  currentQuestionId,
  questionHistory,
  answers = {},
}: QuestionProgressInput): QuestionProgress => {
  const completedAndCurrentCount = questionHistory.length + (currentQuestionId ? 1 : 0);
  const value = Math.max(1, completedAndCurrentCount);

  if (!questionnaire) {
    return {
      value,
      max: value,
      label: `Vraag ${value} van ${value}`,
      text: `Vraag ${value}/${value}`,
    };
  }

  const ids = orderedQuestionIds(questionnaire);
  const questionsById = new Map(
    (questionnaire.questions ?? []).map((question) => [question.id, question]),
  );
  const currentPath = new Set([...questionHistory, currentQuestionId].filter(Boolean));
  const possibleQuestionCount = ids.filter((questionId) => {
    if (currentPath.has(questionId)) return true;
    const question = questionsById.get(questionId);
    if (!question) return true;
    return (question.conditions ?? []).every((condition) =>
      conditionCanStillMatch(answers, condition),
    );
  }).length;

  const max = Math.max(value, possibleQuestionCount, ids.length > 0 ? 1 : value);
  return {
    value,
    max,
    label: `Vraag ${value} van ongeveer ${max}`,
    text: `Vraag ${value}/${max}`,
  };
};
