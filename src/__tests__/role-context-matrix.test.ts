import { describe, expect, it } from "vitest";
import { determineOutcome, parseOutcome, type TypedOutcome } from "@beslismodel/core";
import { assertRoleContextMatrix, type RoleContextMatrixCase } from "@beslismodel/testing";
import mainData from "../../public/main.json";

type Role = "behandelaar" | "triagist";
type Answer = { value: string; text: string };
type AnswerMap = Record<string, Answer | string>;
type Flow = {
  id: string;
  resultsLogic: Parameters<typeof determineOutcome>[1];
};

interface UrinestripContext extends Readonly<Record<string, unknown>> {
  readonly role: Role;
  readonly answers: AnswerMap;
}

const answer = (value: string): Answer => ({ value, text: value });

const stripFlow = (mainData.questionnaires as Flow[]).find((flow) => flow.id === "strip");
if (!stripFlow) {
  throw new Error("Missing strip flow in compiled manifest.");
}

const matrixCase = (
  id: string,
  role: Role,
  answers: AnswerMap,
  expected: TypedOutcome,
): RoleContextMatrixCase<UrinestripContext, TypedOutcome> => ({
  context: { answers, role },
  expected,
  id: `${id}-${role}`,
});

const roles = ["behandelaar", "triagist"] as const;

const cases = roles.flatMap((role) => [
  matrixCase(
    "nitrite-positive-redirect",
    role,
    { q_strip_nitrite: answer("positive") },
    {
      raw: "redirect:bacteriurie",
      target: "bacteriurie",
      type: "redirect",
    },
  ),
  matrixCase(
    "isolated-erythrocyturia-redirect",
    role,
    {
      q_strip_ery: answer("positive_1"),
      q_strip_leuko: answer("negative"),
      q_strip_nitrite: answer("negative"),
    },
    {
      raw: "redirect:hematurie",
      target: "hematurie",
      type: "redirect",
    },
  ),
  matrixCase(
    "all-negative-result",
    role,
    {
      q_strip_ery: answer("negative"),
      q_strip_leuko: answer("negative"),
      q_strip_nitrite: answer("negative"),
    },
    {
      key: "other.noConclusiveAbnormality",
      raw: "result:other.noConclusiveAbnormality",
      type: "result",
    },
  ),
]);

describe("Urinestrip role/context matrix", () => {
  it("keeps strip routing stable for behandelaar and triage contexts", () => {
    const results = assertRoleContextMatrix(cases, ({ context }) =>
      parseOutcome(
        determineOutcome(
          {
            ...context.answers,
            _role: context.role,
          },
          stripFlow.resultsLogic,
        ).outcome,
      ),
    );

    expect(results).toHaveLength(6);
    expect(results.every((result) => result.passed)).toBe(true);
  });
});
