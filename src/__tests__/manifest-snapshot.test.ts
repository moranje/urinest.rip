import { describe, expect, it } from "vitest";
import mainData from "../../public/main.json";

interface ManifestQuestion {
  readonly id: string;
  readonly options?: readonly { readonly value: unknown }[];
}

interface ManifestRule {
  readonly id: string;
  readonly actionType: string;
  readonly resultKey?: string;
  readonly redirectToQuestionnaire?: string;
}

interface ManifestQuestionnaire {
  readonly id: string;
  readonly version?: string;
  readonly category?: string;
  readonly audience?: readonly string[];
  readonly domain?: string;
  readonly hiddenFromLandingPage?: boolean;
  readonly recommendedStart?: boolean;
  readonly questions: readonly ManifestQuestion[];
  readonly results: Readonly<Record<string, unknown>>;
  readonly resultsLogic: readonly ManifestRule[];
}

describe("compiled manifest snapshot", () => {
  it("keeps stable public flow structure", () => {
    const summary = (mainData.questionnaires as readonly ManifestQuestionnaire[]).map((flow) => ({
      id: flow.id,
      version: flow.version,
      category: flow.category,
      audience: flow.audience,
      domain: flow.domain,
      hiddenFromLandingPage: flow.hiddenFromLandingPage,
      recommendedStart: flow.recommendedStart,
      questionIds: flow.questions.map((question) => question.id),
      optionValues: Object.fromEntries(
        flow.questions.map((question) => [
          question.id,
          (question.options ?? []).map((option) => String(option.value)),
        ]),
      ),
      resultKeys: Object.keys(flow.results).sort(),
      rules: flow.resultsLogic.map((rule) => ({
        id: rule.id,
        actionType: rule.actionType,
        resultKey: rule.resultKey,
        redirectToQuestionnaire: rule.redirectToQuestionnaire,
      })),
    }));

    expect(summary).toMatchSnapshot();
  });
});
