import type { LocationQuery, RouteLocationRaw } from "vue-router";

export const QUESTION_ROUTE_QUERY_KEY = "q";

export function readQuestionRouteQuery(query: LocationQuery): string | null {
  const value = query[QUESTION_ROUTE_QUERY_KEY];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function createQuestionRouteLocation(
  questionnaireId: string,
  questionId: string,
  currentQuery: LocationQuery,
): RouteLocationRaw {
  return {
    name: "Questionnaire",
    params: { id: questionnaireId },
    query: {
      ...currentQuery,
      [QUESTION_ROUTE_QUERY_KEY]: questionId,
    },
  };
}

export function createResultRouteLocation(resultKey: string): RouteLocationRaw {
  return {
    name: "Result",
    params: { resultKey },
    query: {},
  };
}

export function buildQuestionRouteHistory(options: {
  readonly targetQuestionId: string;
  readonly questionIds: readonly string[];
  readonly findNextQuestionId: (startQuestionId: string | null) => string | null;
}): string[] | null {
  const { targetQuestionId, questionIds, findNextQuestionId } = options;
  if (!questionIds.includes(targetQuestionId)) return null;

  const history: string[] = [];
  const seen = new Set<string>();
  let cursor = findNextQuestionId(null);

  while (cursor) {
    if (cursor === targetQuestionId) return history;
    if (seen.has(cursor)) return null;
    seen.add(cursor);
    history.push(cursor);
    cursor = findNextQuestionId(cursor);
  }

  return null;
}
