export const dmCarePackageMetadata = Object.freeze({
  id: "dm-care",
  packageName: "@beslismodel/dm-care",
  version: "0.1.0-next.1",
  status: "verified",
  domain: "DM care",
  sourcePolicy: {
    requiresFormulaVersion: true,
    requiresSourceReferences: true,
    requiresIndependentTestVectors: true,
    exportsClinicalCalculators: true,
  },
} as const);

export type DmCarePackageStatus = typeof dmCarePackageMetadata.status;
