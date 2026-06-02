import type { LocationQuery, RouteLocationRaw } from "vue-router";

export const QUESTION_ROUTE_QUERY_KEY = "q";
export const RESULT_BACK_QUERY_KEY = "from";

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

export function createResultRouteLocation(resultKey: string, backTarget: string): RouteLocationRaw {
  return {
    name: "Result",
    params: { resultKey },
    query: { [RESULT_BACK_QUERY_KEY]: backTarget },
  };
}

export function readResultBackTarget(query: LocationQuery): string {
  const value = query[RESULT_BACK_QUERY_KEY];
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/questionnaire/")) return "/";

  try {
    const url = new URL(value, "https://urinest.local");
    if (url.hash) return "/";
    if (!url.pathname.startsWith("/questionnaire/")) return "/";
    if (/%2f|%5c/i.test(url.pathname)) return "/";

    const parts = url.pathname.split("/");
    if (parts.length !== 3 || parts[2]?.length === 0) return "/";

    const allowedSearchKeys = [...url.searchParams.keys()].every(
      (key) => key === QUESTION_ROUTE_QUERY_KEY,
    );
    if (!allowedSearchKeys) return "/";

    const questionId = url.searchParams.get(QUESTION_ROUTE_QUERY_KEY);
    if (!questionId) return url.pathname;

    return `${url.pathname}?${QUESTION_ROUTE_QUERY_KEY}=${encodeURIComponent(questionId)}`;
  } catch {
    return "/";
  }
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
