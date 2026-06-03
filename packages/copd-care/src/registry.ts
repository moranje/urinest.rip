import { createCalculatorRegistry, type CalculatorRegistry } from "@beslismodel/core";
import { goldAbeCalculator } from "./gold-abe";
import { copdCarePackageMetadata } from "./package-metadata";

export const copdCareCalculatorIds = ["copd.gold_abe"] as const;

export const createCopdCareCalculatorRegistry = (): CalculatorRegistry =>
  createCalculatorRegistry([goldAbeCalculator]);

export const copdCareRegistryStatus = Object.freeze({
  status: copdCarePackageMetadata.status,
  calculatorCount: copdCareCalculatorIds.length,
  exportsClinicalCalculators: true,
});
