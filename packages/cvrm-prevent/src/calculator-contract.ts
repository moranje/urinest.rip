import {
  isVerifiedCalculatorDefinition,
  type CalculatorDefinition,
  type CalculatorSourceReference,
  type CalculatorTestVector,
  type VerifiedCalculatorDefinition,
} from "@beslismodel/core";

export type CvrmPreventSourceReference = CalculatorSourceReference;

export type CvrmPreventTestVector<Input = unknown, Output = unknown> = CalculatorTestVector<
  Input,
  Output
>;

export type VerifiedCvrmPreventCalculatorDefinition<
  Input = unknown,
  Output = unknown,
  TestVectorOutput = Output,
> = VerifiedCalculatorDefinition<Input, Output, TestVectorOutput>;

export const isVerifiedCvrmPreventCalculator = (
  calculator: CalculatorDefinition,
): calculator is VerifiedCvrmPreventCalculatorDefinition =>
  isVerifiedCalculatorDefinition(calculator);
