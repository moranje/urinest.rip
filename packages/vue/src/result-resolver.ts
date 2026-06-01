import {
  parseOutcome,
  type NoneOutcome,
  type RedirectOutcome,
  type ResultOutcome,
} from "@beslismodel/core";
import { shallowRef } from "vue";
import type { BeslismodelAnswerMap, BeslismodelOutcomeResult } from "./store";

export interface BeslismodelResultResolverStore<
  Answer = unknown,
  ResultLogicRule = unknown,
  Outcome extends BeslismodelOutcomeResult = BeslismodelOutcomeResult,
> {
  getAllAnswersForQuestionnaire(questionnaireId: string): BeslismodelAnswerMap<Answer>;
  getFullQuestionnaire(
    questionnaireId: string,
  ): { readonly resultsLogic: readonly ResultLogicRule[] } | null;
  determineOutcomeForPath(
    questionnaireId: string,
    answers: BeslismodelAnswerMap<Answer>,
    logic: readonly ResultLogicRule[],
  ): Outcome;
}

export interface ResolveBeslismodelResultOptions<Answer = unknown> {
  readonly answers?: BeslismodelAnswerMap<Answer>;
}

interface BaseResolvedResult<
  Outcome extends BeslismodelOutcomeResult,
  TypedOutcome extends ReturnType<typeof parseOutcome>,
> {
  readonly questionnaireId: string;
  readonly ruleId: string | null;
  readonly rawOutcome: Outcome;
  readonly typedOutcome: TypedOutcome;
  readonly answeredQuestionIds: readonly string[];
}

export type BeslismodelResolvedResult<
  Outcome extends BeslismodelOutcomeResult = BeslismodelOutcomeResult,
> =
  | (BaseResolvedResult<Outcome, ResultOutcome> & {
      readonly type: "result";
      readonly resultKey: string;
    })
  | (BaseResolvedResult<Outcome, RedirectOutcome> & {
      readonly type: "redirect";
      readonly targetQuestionnaireId: string;
    })
  | (BaseResolvedResult<Outcome, NoneOutcome> & {
      readonly type: "none";
    });

export function useResultResolver<
  Answer = unknown,
  ResultLogicRule = unknown,
  Outcome extends BeslismodelOutcomeResult = BeslismodelOutcomeResult,
>(store: BeslismodelResultResolverStore<Answer, ResultLogicRule, Outcome>) {
  const lastResult = shallowRef<BeslismodelResolvedResult<Outcome> | null>(null);
  const error = shallowRef<Error | null>(null);

  const resolveResult = (
    questionnaireId: string,
    options: ResolveBeslismodelResultOptions<Answer> = {},
  ): BeslismodelResolvedResult<Outcome> => {
    error.value = null;
    const questionnaire = store.getFullQuestionnaire(questionnaireId);
    if (!questionnaire) {
      const missingError = new Error(`Unknown questionnaire: ${questionnaireId}`);
      error.value = missingError;
      throw missingError;
    }

    const answers = options.answers ?? store.getAllAnswersForQuestionnaire(questionnaireId);
    const rawOutcome = store.determineOutcomeForPath(
      questionnaireId,
      answers,
      questionnaire.resultsLogic,
    );
    const answeredQuestionIds = Object.keys(answers);

    try {
      const typedOutcome = parseOutcome(rawOutcome.outcome);
      const base = {
        answeredQuestionIds,
        questionnaireId,
        rawOutcome,
        ruleId: rawOutcome.ruleId,
      };

      const resolved: BeslismodelResolvedResult<Outcome> =
        typedOutcome.type === "result"
          ? {
              ...base,
              resultKey: typedOutcome.key,
              type: "result",
              typedOutcome,
            }
          : typedOutcome.type === "redirect"
            ? {
                ...base,
                targetQuestionnaireId: typedOutcome.target,
                type: "redirect",
                typedOutcome,
              }
            : {
                ...base,
                type: "none",
                typedOutcome,
              };

      lastResult.value = resolved;
      return resolved;
    } catch (caught) {
      const resultError = caught instanceof Error ? caught : new Error("Result resolution failed");
      error.value = resultError;
      throw resultError;
    }
  };

  return {
    error,
    lastResult,
    resolveResult,
  };
}
