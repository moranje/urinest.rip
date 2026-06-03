import type { CalculatorDefinition } from "@beslismodel/core";

export interface CvrmPreventSourceReference {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly version: string;
  readonly retrieved?: string;
}

export interface CvrmPreventTestVector<Input = unknown, Output = unknown> {
  readonly id: string;
  readonly input: Input;
  readonly expected: Output;
  readonly sourceReferenceId: string;
  readonly tolerance?: number;
}

export interface VerifiedCvrmPreventCalculatorDefinition<
  Input = unknown,
  Output = unknown,
  TestVectorOutput = Output,
> extends CalculatorDefinition<Input, Output> {
  readonly formulaVersion: string;
  readonly sourceReferences: readonly CvrmPreventSourceReference[];
  readonly testVectors: readonly CvrmPreventTestVector<Input, TestVectorOutput>[];
  readonly verificationStatus: "verified";
}

export const isVerifiedCvrmPreventCalculator = (
  calculator: CalculatorDefinition,
): calculator is VerifiedCvrmPreventCalculatorDefinition =>
  "verificationStatus" in calculator &&
  calculator.verificationStatus === "verified" &&
  "formulaVersion" in calculator &&
  "sourceReferences" in calculator &&
  "testVectors" in calculator &&
  Array.isArray(calculator.sourceReferences) &&
  calculator.sourceReferences.length > 0 &&
  Array.isArray(calculator.testVectors) &&
  calculator.testVectors.length > 0;
