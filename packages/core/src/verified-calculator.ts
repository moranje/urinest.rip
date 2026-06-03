import type { CalculatorDefinition } from "./calculator";

export interface CalculatorSourceReference {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly version: string;
  readonly retrieved?: string;
}

export interface CalculatorTestVector<Input = unknown, Output = unknown> {
  readonly id: string;
  readonly input: Input;
  readonly expected: Output;
  readonly sourceReferenceId: string;
  readonly tolerance?: number;
}

export interface VerifiedCalculatorDefinition<
  Input = unknown,
  Output = unknown,
  TestVectorOutput = Output,
> extends CalculatorDefinition<Input, Output> {
  readonly formulaVersion: string;
  readonly sourceReferences: readonly CalculatorSourceReference[];
  readonly testVectors: readonly CalculatorTestVector<Input, TestVectorOutput>[];
  readonly verificationStatus: "verified";
}

export interface VerifiedCalculatorValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function isVerifiedCalculatorDefinition(
  calculator: CalculatorDefinition,
): calculator is VerifiedCalculatorDefinition {
  return validateVerifiedCalculator(calculator).valid;
}

export function validateVerifiedCalculator(
  calculator: CalculatorDefinition,
): VerifiedCalculatorValidationResult {
  const errors: string[] = [];
  const candidate = calculator as Partial<VerifiedCalculatorDefinition>;

  if (candidate.verificationStatus !== "verified") {
    errors.push("verificationStatus must be verified");
  }
  if (!hasText(candidate.formulaVersion)) {
    errors.push("formulaVersion must be present");
  }
  if (!Array.isArray(candidate.sourceReferences) || candidate.sourceReferences.length === 0) {
    errors.push("sourceReferences must be non-empty");
  }
  if (!Array.isArray(candidate.testVectors) || candidate.testVectors.length === 0) {
    errors.push("testVectors must be non-empty");
  }

  const sourceIds = new Set<string>();
  for (const source of candidate.sourceReferences ?? []) {
    if (!hasText(source.id)) errors.push("sourceReference.id must be present");
    if (!hasText(source.title))
      errors.push(`sourceReference ${source.id || "<empty>"} needs title`);
    if (!hasText(source.url)) errors.push(`sourceReference ${source.id || "<empty>"} needs url`);
    if (!hasText(source.version))
      errors.push(`sourceReference ${source.id || "<empty>"} needs version`);
    if (hasText(source.id)) sourceIds.add(source.id);
  }

  for (const vector of candidate.testVectors ?? []) {
    if (!hasText(vector.id)) errors.push("testVector.id must be present");
    if (!hasText(vector.sourceReferenceId)) {
      errors.push(`testVector ${vector.id || "<empty>"} needs sourceReferenceId`);
      continue;
    }
    if (!sourceIds.has(vector.sourceReferenceId)) {
      errors.push(
        `testVector ${vector.id || "<empty>"} references unknown source ${vector.sourceReferenceId}`,
      );
    }
  }

  return Object.freeze({
    errors: Object.freeze(errors),
    valid: errors.length === 0,
  });
}
