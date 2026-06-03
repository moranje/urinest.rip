import { createCalculatorRegistry, type CalculatorRegistry } from "@beslismodel/core";
import { hba1cConversionCalculator } from "./hba1c";
import { dmCarePackageMetadata } from "./package-metadata";

export const dmCareCalculatorIds = ["dm.hba1c_conversion"] as const;

export const createDmCareCalculatorRegistry = (): CalculatorRegistry =>
  createCalculatorRegistry([hba1cConversionCalculator]);

export const dmCareRegistryStatus = Object.freeze({
  status: dmCarePackageMetadata.status,
  calculatorCount: dmCareCalculatorIds.length,
  exportsClinicalCalculators: true,
});
