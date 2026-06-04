export const copdCarePackageMetadata = Object.freeze({
  id: "copd-care",
  packageName: "@beslismodel/copd-care",
  version: "0.1.0",
  status: "verified",
  domain: "COPD care",
  sourcePolicy: {
    requiresFormulaVersion: true,
    requiresSourceReferences: true,
    requiresIndependentTestVectors: true,
    exportsClinicalCalculators: true,
  },
} as const);

export type CopdCarePackageStatus = typeof copdCarePackageMetadata.status;
