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
  readonly name?: string;
  readonly title?: string;
  readonly category?: string;
  readonly audience?: readonly string[];
  readonly domain?: string;
  readonly icon?: string;
  readonly hiddenFromLandingPage?: boolean;
  readonly recommendedStart?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
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
      icon: flow.icon,
      hiddenFromLandingPage: flow.hiddenFromLandingPage,
      recommendedStart: flow.recommendedStart,
      metadata: flow.metadata,
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

  it("preserves landing taxonomy for the generated dev manifest", () => {
    const flows = new Map(
      (mainData.questionnaires as readonly ManifestQuestionnaire[]).map((flow) => [flow.id, flow]),
    );

    expect(flows.get("strip")).toEqual(
      expect.objectContaining({
        icon: "strip",
        metadata: expect.objectContaining({
          landingOrder: 20,
          landingSection: "primary",
        }),
      }),
    );
    expect(flows.get("bacteriurie")).toEqual(
      expect.objectContaining({
        name: "Bacteriurie",
        metadata: expect.objectContaining({
          landingDescription: "Diagnose & behandeling",
          landingOrder: 110,
          landingSection: "secondary",
        }),
      }),
    );
    expect(flows.get("kweek")).toEqual(
      expect.objectContaining({
        icon: "culture",
        name: "Kweek",
        metadata: expect.objectContaining({
          landingOrder: 50,
          landingSection: "primary",
        }),
      }),
    );
  });
});
