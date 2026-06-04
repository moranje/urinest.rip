import { describe, expect, it } from "vitest";
import { validateRoleResponsibilityMatrix } from "./check-role-responsibility-matrix.mjs";

const validMatrix = {
  schema: "role-responsibility-matrix-v1",
  reviewedOn: "2026-06-04",
  scope: "test",
  runtimeRoles: {
    behandelaar: {
      label: "Arts",
      exposedInApp: true,
      careRoles: ["arts", "verpleegkundige"],
      canSeeTreatment: true,
      canDocumentTreatment: true,
      responsibilities: ["diagnostiek"],
      forbiddenActions: [],
    },
    triagist: {
      label: "Triage",
      exposedInApp: true,
      careRoles: ["triagist", "doktersassistent"],
      canSeeTreatment: false,
      canDocumentTreatment: false,
      responsibilities: ["triage"],
      forbiddenActions: ["behandeling kiezen"],
    },
  },
  careRoles: {
    arts: {
      label: "Arts",
      status: "covered-by-runtime-mode",
      runtimeRole: "behandelaar",
      canSeeTreatment: true,
      canDocumentTreatment: true,
      responsibilities: ["diagnose"],
      mustEscalateWhen: [],
    },
    triagist: {
      label: "Triagist",
      status: "covered-by-runtime-mode",
      runtimeRole: "triagist",
      canSeeTreatment: false,
      canDocumentTreatment: false,
      responsibilities: ["triage"],
      mustEscalateWhen: ["red_flags"],
    },
    doktersassistent: {
      label: "Doktersassistent",
      status: "covered-by-runtime-mode",
      runtimeRole: "triagist",
      canSeeTreatment: false,
      canDocumentTreatment: false,
      responsibilities: ["intake"],
      mustEscalateWhen: ["outside_protocol"],
    },
    verpleegkundige: {
      label: "Verpleegkundige",
      status: "covered-by-runtime-mode",
      runtimeRole: "behandelaar",
      canSeeTreatment: true,
      canDocumentTreatment: true,
      responsibilities: ["protocolzorg"],
      mustEscalateWhen: ["outside_protocol"],
    },
    poh: {
      label: "POH",
      status: "not-exposed",
      runtimeRole: null,
      canSeeTreatment: false,
      canDocumentTreatment: false,
      responsibilities: ["niet zichtbaar"],
      mustEscalateWhen: ["domain_not_exposed"],
    },
  },
  questionnaireAudiencePolicy: {
    allowedAudienceValues: ["behandelaar", "triagist"],
    notExposedCareRoles: ["poh"],
    treatmentHiddenForRuntimeRoles: ["triagist"],
    forbiddenTreatmentQuestionPatterns: ["welke behandeling"],
    forbiddenTreatmentResultFields: ["treatment"],
    requireResolvedOutcomeForRuntimeRoles: true,
  },
};

const manifest = {
  questionnaires: [
    {
      id: "strip",
      audience: ["behandelaar", "triagist"],
      questions: [],
      results: { safe: { title: "Veilig resultaat" } },
      resultsLogic: [{ resultKey: "safe", conditions: [] }],
    },
    {
      id: "gezonde-vrouwen",
      audience: ["behandelaar"],
      questions: [],
      results: { safe: { title: "Behandelaar resultaat", treatment: "Controleer beleid." } },
      resultsLogic: [{ resultKey: "safe", conditions: [] }],
    },
  ],
};

const roleToggleSource = `
const roleOptions = [
  { value: "behandelaar", label: "Arts" },
  { value: "triagist", label: "Triage" },
];
`;

const userTypesSource = 'export type UserRole = "behandelaar" | "triagist";';

function validate(overrides = {}) {
  return validateRoleResponsibilityMatrix({
    manifest,
    matrix: { ...validMatrix, ...overrides },
    roleToggleSource,
    userTypesSource,
  });
}

describe("role responsibility matrix gate", () => {
  it("accepts a complete runtime and care-role matrix", () => {
    expect(validate()).toEqual([]);
  });

  it("rejects unknown questionnaire audiences", () => {
    const errors = validateRoleResponsibilityMatrix({
      manifest: { questionnaires: [{ id: "cvrm", audience: ["poh"] }] },
      matrix: validMatrix,
      roleToggleSource,
      userTypesSource,
    });

    expect(errors.join("\n")).toContain('role "poh" is not allowed');
  });

  it("rejects treatment visibility for a care role mapped through a non-treatment runtime role", () => {
    const errors = validate({
      careRoles: {
        ...validMatrix.careRoles,
        doktersassistent: {
          ...validMatrix.careRoles.doktersassistent,
          canSeeTreatment: true,
        },
      },
    });

    expect(errors.join("\n")).toContain("careRoles.doktersassistent: cannot see treatment");
  });

  it("rejects reachable treatment questions and results for triage roles", () => {
    const errors = validateRoleResponsibilityMatrix({
      manifest: {
        questionnaires: [
          {
            id: "unsafe",
            audience: ["triagist"],
            questions: [
              {
                id: "q_treatment",
                text: "Welke behandeling kan patiënt krijgen?",
                options: [{ value: "nitrofurantoin" }],
              },
            ],
            results: {
              unsafe: { title: "Behandeling", treatment: "Nitrofurantoine" },
            },
            resultsLogic: [
              {
                resultKey: "unsafe",
                conditions: [
                  {
                    questionId: "q_treatment",
                    operator: "equals",
                    value: "nitrofurantoin",
                  },
                ],
              },
            ],
          },
        ],
      },
      matrix: validMatrix,
      roleToggleSource,
      userTypesSource,
    });

    const output = errors.join("\n");
    expect(output).toContain('forbidden treatment question "q_treatment"');
    expect(output).toContain('forbidden treatment result "unsafe"');
  });
});
