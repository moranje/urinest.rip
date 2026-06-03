import { createCalculatorRegistry, type CalculatorRegistry } from "@beslismodel/core";
import { cvrmPreventPackageMetadata } from "./package-metadata";
import { score2Calculator } from "./score2";

export const cvrmPreventCalculatorIds = ["cvrm.score2"] as const;

export const createCvrmPreventCalculatorRegistry = (): CalculatorRegistry =>
  createCalculatorRegistry([score2Calculator]);

export const cvrmPreventRegistryStatus = Object.freeze({
  status: cvrmPreventPackageMetadata.status,
  calculatorCount: cvrmPreventCalculatorIds.length,
  exportsClinicalCalculators: true,
});
