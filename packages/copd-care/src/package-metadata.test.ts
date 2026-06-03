import { describe, expect, it } from "vitest";
import packageManifest from "../package.json" with { type: "json" };
import { copdCarePackageMetadata } from "./package-metadata";

describe("copd care package metadata", () => {
  it("declares a verified domain package with enforced source policy", () => {
    expect(copdCarePackageMetadata).toMatchObject({
      packageName: "@beslismodel/copd-care",
      status: "verified",
      domain: "COPD care",
      sourcePolicy: {
        requiresFormulaVersion: true,
        requiresSourceReferences: true,
        requiresIndependentTestVectors: true,
        exportsClinicalCalculators: true,
      },
    });
  });

  it("keeps exported metadata aligned with the package manifest", () => {
    expect(copdCarePackageMetadata.version).toBe(packageManifest.version);
  });
});
