import { describe, expect, it } from "vitest";
import { validateClinicalDutchCopy } from "./check-clinical-dutch-copy.mjs";

function manifestWith(overrides = {}) {
  return {
    version: "test",
    questionnaires: [
      {
        id: "test",
        version: "1",
        name: "Urinestrip",
        title: "Urinestrip",
        description: "Diagnostiek bij urinewegklachten.",
        metadata: {
          landingDescription: "Diagnose en beleid",
        },
        questions: [
          {
            id: "q_test",
            text: "Is eGFR < 30 ml/min of gewicht > 50 kg relevant?",
            type: "select",
            description: "Gebruik klinische gegevens uit het dossier.",
            options: [
              { id: "o_yes", text: "Ja", value: "positive" },
              { id: "o_no", text: "Nee", value: "negative" },
            ],
          },
        ],
        results: {
          safe: {
            title: "Controle nodig",
            description: "Controleer contra-indicaties en nierfunctie.",
            documentation: "Besproken: controle voor behandeling.",
            warnings: "Bij eGFR < 30: 500 mg iedere 24 uur.",
            sources: [{ name: "Bron", url: "https://example.test/positive/next" }],
          },
        },
        resultsLogic: [
          {
            rule: { field: "q_test", operator: "eq", value: "positive" },
            show: "safe",
            redirectToQuestionnaire: "next",
          },
        ],
        ...overrides,
      },
    ],
  };
}

describe("clinical Dutch copy gate", () => {
  it("accepts clinical comparison signs and skips internal logic fields", () => {
    expect(validateClinicalDutchCopy(manifestWith())).toEqual([]);
  });

  it("rejects raw HTML tags", () => {
    const errors = validateClinicalDutchCopy(
      manifestWith({
        questions: [
          {
            id: "q_test",
            text: "<script>alert(1)</script>",
            type: "select",
            options: [{ id: "o_yes", text: "Ja", value: "positive" }],
          },
        ],
      }),
    );

    expect(errors.join("\n")).toContain("raw HTML tags");
  });

  it("rejects placeholders, internal English terms and generic guideline phrases", () => {
    const errors = validateClinicalDutchCopy(
      manifestWith({
        description: "TODO ${name}",
        questions: [
          {
            id: "q_test",
            text: "Choose next result",
            type: "select",
            description: "Beleid conform richtlijn.",
            options: [{ id: "o_yes", text: "Ja", value: "positive" }],
          },
        ],
      }),
    );

    const output = errors.join("\n");
    expect(output).toContain("unresolved placeholder text");
    expect(output).toContain('English UI/internal term "Choose"');
    expect(output).toContain('English UI/internal term "next"');
    expect(output).toContain('English UI/internal term "result"');
    expect(output).toContain('generic guideline phrase "Beleid conform"');
  });

  it("rejects compact medication and unit formatting", () => {
    const errors = validateClinicalDutchCopy(
      manifestWith({
        results: {
          safe: {
            title: "Controle nodig",
            description: "Controleer contra-indicaties.",
            treatment: "Nitrofurantoine 500mg.",
          },
        },
      }),
    );

    expect(errors.join("\n")).toContain('medication/unit copy "500mg"');
  });
});
