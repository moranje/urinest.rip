export const cvrmPreventPackageMetadata = Object.freeze({
  id: "cvrm-prevent",
  packageName: "@beslismodel/cvrm-prevent",
  version: "0.1.0",
  status: "verified",
  domain: "CVRM/U-Prevent",
  sourcePolicy: {
    requiresFormulaVersion: true,
    requiresSourceReferences: true,
    requiresIndependentTestVectors: true,
    exportsClinicalCalculators: true,
  },
} as const);

export type CvrmPreventPackageStatus = typeof cvrmPreventPackageMetadata.status;
