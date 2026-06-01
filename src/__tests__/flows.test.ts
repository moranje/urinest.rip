import { describe, expect, it } from "vitest";
import { determineOutcome, validateConditions } from "decision-engine-core";
import mainData from "../../public/main.json";

type Option = { id: string; value: string; text: string };
type Question = {
  id: string;
  type: string;
  options: Option[];
  conditions?: Condition[];
};
type Step = { questionIds: string[] };
type Condition = { questionId: string; operator: string; value: unknown };
type LogicRule = {
  id: string;
  conditions: Condition[];
  actionType: string;
  resultKey?: string;
  redirectToQuestionnaire?: string;
};
type Flow = {
  id: string;
  questions: Question[];
  steps: Step[];
  results: Record<string, unknown>;
  resultsLogic: LogicRule[];
};
type Answer = { value: string; text: string };
type AnswerMap = Record<string, Answer | Answer[] | string>;

const flows = (mainData.questionnaires as Flow[]).map((flow) => [flow.id, flow] as const);
const flowById = new Map(flows);

const answer = (value: string): Answer => ({ value, text: value });

function getFlow(id: string): Flow {
  const flow = flowById.get(id);
  if (!flow) throw new Error(`Missing flow ${id}`);
  return flow;
}

function expectOutcome(flowId: string, answers: AnswerMap, expected: string): void {
  const flow = getFlow(flowId);
  const result = determineOutcome(answers, flow.resultsLogic);
  expect(result.outcome).toBe(expected);
}

describe("critical clinical flow paths", () => {
  it.each([
    [
      "strip nitriet-positive redirects to bacteriurie",
      "strip",
      { q_strip_nitrite: answer("positive"), _role: "behandelaar" },
      "redirect:bacteriurie",
    ],
    [
      "strip leukocyturie redirects to leukocyturie flow",
      "strip",
      {
        q_strip_nitrite: answer("negative"),
        q_strip_leuko: answer("positive"),
        _role: "behandelaar",
      },
      "redirect:leukocyturie",
    ],
    [
      "strip isolated erythrocyturia redirects to hematurie flow",
      "strip",
      {
        q_strip_nitrite: answer("negative"),
        q_strip_leuko: answer("negative"),
        q_strip_ery: answer("positive"),
        _role: "behandelaar",
      },
      "redirect:hematurie",
    ],
    [
      "strip all negative returns no conclusive abnormality",
      "strip",
      {
        q_strip_nitrite: answer("negative"),
        q_strip_leuko: answer("negative"),
        q_strip_ery: answer("negative"),
        _role: "behandelaar",
      },
      "result:other.noConclusiveAbnormality",
    ],
    [
      "pregnant local cystitis nitrofurantoin path resolves",
      "bacteriurie",
      {
        q_bac_tissue: answer("local"),
        q_bac_risk: answer("pregnant"),
        q_bac_tx_local_pregnant: answer("0"),
        _role: "behandelaar",
      },
      "result:uti.local.pregnant.0",
    ],
    [
      "pregnant tissue invasion routes to referral result",
      "bacteriurie",
      {
        q_bac_tissue: answer("tissueInvasion"),
        q_bac_risk: answer("pregnant"),
        _role: "behandelaar",
      },
      "result:uti.tissueInvasion.pregnant",
    ],
    [
      "elderly asymptomatic bacteriurie returns no antibiotics",
      "bacteriurie",
      {
        q_bac_tissue: answer("local"),
        q_bac_risk: answer("elderly"),
        q_bac_elderly: answer("asymptomatic"),
        _role: "behandelaar",
      },
      "result:uti.local.elderly",
    ],
    [
      "healthy local cystitis treatment option resolves",
      "bacteriurie",
      {
        q_bac_tissue: answer("local"),
        q_bac_risk: answer("healthy"),
        q_bac_catheter: answer("no"),
        q_bac_tx_local_healthy: answer("0"),
        _role: "behandelaar",
      },
      "result:uti.local.healthy.0",
    ],
    [
      "leukocyturie child dipslide path resolves",
      "leukocyturie",
      {
        q_leuk_population: answer("child"),
        q_leuk_followup_child: answer("dipslide"),
        _role: "triagist",
      },
      "result:leukocytes.dipslide",
    ],
    [
      "hematurie visible path resolves",
      "hematurie",
      { q_hematuria_type: answer("visible"), _role: "behandelaar" },
      "result:blood.visibleHematuria",
    ],
    [
      "dipslide positive redirects to bacteriurie",
      "dipslide",
      { q_ds_macconkey: answer("positive"), _role: "triagist" },
      "redirect:bacteriurie",
    ],
    [
      "healthy-women all criteria and nitrofurantoin resolves",
      "gezonde-vrouwen",
      {
        q_gv_checklist: ["1", "2", "3", "4", "5", "6", "7"].map(answer),
        q_gv_treatment: answer("1"),
        _role: "behandelaar",
      },
      "result:uti.local.healthy.1",
    ],
  ])("%s", (_name, flowId, answers, expected) => {
    expectOutcome(flowId as string, answers as AnswerMap, expected as string);
  });

  it("documents nitrofurantoin pregnancy contraindication from 36 weeks", () => {
    const result = getFlow("bacteriurie").results["uti.local.pregnant.0"] as {
      contraindications?: Array<{ text: string }>;
      warnings?: string;
    };

    expect(result.contraindications?.map((item) => item.text)).toContain(
      "Zwangerschapsduur ≥ 36 weken",
    );
    expect(result.warnings).toContain("gecontra-indiceerd vanaf 36 weken zwangerschap");
  });
});

describe("dead-end coverage", () => {
  it.each(flows)("has no reachable dead ends for %s", (flowId, flow) => {
    const questionById = new Map(flow.questions.map((question) => [question.id, question]));
    const orderedQuestionIds = flow.steps.flatMap((step) => step.questionIds);
    const failures: string[] = [];
    const seen = new Set<string>();

    const nextQuestionId = (answers: AnswerMap, startQuestionId: string | null): string | null => {
      let searching = !startQuestionId;
      for (const questionId of orderedQuestionIds) {
        if (!searching) {
          searching = questionId === startQuestionId;
          continue;
        }
        const question = questionById.get(questionId);
        if (!question) continue;
        if (validateConditions(answers, question.conditions ?? []).isValid) return questionId;
      }
      return null;
    };

    const enumerateOptions = (question: Question): Array<Answer | Answer[]> => {
      if (question.type === "multiple" || question.type === "multi_select") {
        const subsets: Answer[][] = [];
        for (let mask = 1; mask < 1 << question.options.length; mask += 1) {
          subsets.push(
            question.options
              .filter((_option, index) => (mask & (1 << index)) !== 0)
              .map((option) => answer(option.value)),
          );
        }
        return subsets;
      }
      return question.options.map((option) => answer(option.value));
    };

    const walk = (answers: AnswerMap, currentQuestionId: string | null): void => {
      const next = nextQuestionId(answers, currentQuestionId);
      if (!next) {
        const outcome = determineOutcome(answers, flow.resultsLogic).outcome as string | null;
        if (!outcome) {
          failures.push(JSON.stringify(answers));
          return;
        }
        const [type, value] = outcome.split(":");
        if (type === "result" && !flow.results[value]) failures.push(`missing result ${value}`);
        if (type === "redirect" && !flowById.has(value)) failures.push(`missing flow ${value}`);
        return;
      }

      const question = questionById.get(next);
      if (!question) {
        failures.push(`missing question ${next}`);
        return;
      }

      for (const optionAnswer of enumerateOptions(question)) {
        const nextAnswers = { ...answers, [question.id]: optionAnswer };
        const signature = `${next}|${JSON.stringify(nextAnswers)}`;
        if (seen.has(signature)) continue;
        seen.add(signature);
        walk(nextAnswers, next);
      }
    };

    for (const role of ["behandelaar", "triagist"]) {
      walk({ _role: role }, null);
    }

    expect(failures).toEqual([]);
  });
});
