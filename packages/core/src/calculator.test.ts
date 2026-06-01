/* eslint-disable security/detect-non-literal-fs-filename */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createCalculatorRegistry, type CalculatorDefinition } from "./calculator";

interface SumInput {
  values: number[];
}

const isSumInput = (input: unknown): input is SumInput =>
  typeof input === "object" &&
  input !== null &&
  "values" in input &&
  Array.isArray((input as SumInput).values) &&
  (input as SumInput).values.every((value) => typeof value === "number");

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

describe("calculator registry", () => {
  it("runs synchronous calculators with typed input and runtime context", async () => {
    const registry = createCalculatorRegistry([
      {
        id: "score.sum",
        validateInput: isSumInput,
        calculate: (input, context) => ({
          total: input.values.reduce((sum, value) => sum + value, 0),
          role: context.role,
        }),
      } satisfies CalculatorDefinition<SumInput, { total: number; role?: string }>,
    ]);

    await expect(
      registry.run<{ total: number; role?: string }>(
        "score.sum",
        { values: [1, 2, 3] },
        {
          role: "clinician",
        },
      ),
    ).resolves.toEqual({ total: 6, role: "clinician" });
  });

  it("runs asynchronous calculators", async () => {
    const registry = createCalculatorRegistry([
      {
        id: "score.async",
        calculate: async (input: number) => input * 2,
      },
    ]);

    await expect(registry.run<number>("score.async", 4)).resolves.toBe(8);
  });

  it("rejects duplicate, unknown and invalid calculator calls", async () => {
    expect(() =>
      createCalculatorRegistry([
        { id: "score.sum", calculate: () => 1 },
        { id: "score.sum", calculate: () => 2 },
      ]),
    ).toThrow("Duplicate calculator id: score.sum");

    const registry = createCalculatorRegistry([
      { id: "score.sum", validateInput: isSumInput, calculate: () => 1 },
    ]);

    expect(() => registry.get("score.missing")).toThrow("Unknown calculator id: score.missing");
    await expect(registry.run("score.sum", { values: ["1"] })).rejects.toThrow(
      "Invalid input for calculator id: score.sum",
    );
  });

  it("keeps core free from domain-specific calculator implementations", () => {
    const sourceDir = dirname(fileURLToPath(import.meta.url));
    const source = walk(sourceDir)
      .filter((path) => path.endsWith(".ts") && !path.endsWith(".test.ts"))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n")
      .toLowerCase();
    const domainTerms = [
      "ascvd",
      "blood pressure",
      "cholesterol",
      "copd",
      "cvrm",
      "diabetes",
      "egfr",
      "hba1c",
      "prevent",
      "score2",
      "statin",
      "systolic",
      "urine",
    ];

    for (const term of domainTerms) {
      expect(source, `core implementation must not contain domain term: ${term}`).not.toContain(
        term,
      );
    }
  });
});
