import { describe, expect, it } from "vitest";
import packageManifest from "../package.json" with { type: "json" };
import { dmCarePackageMetadata } from "./package-metadata";

describe("dm care package metadata", () => {
  it("declares a verified domain package with enforced source policy", () => {
    expect(dmCarePackageMetadata).toMatchObject({
      packageName: "@beslismodel/dm-care",
      status: "verified",
      domain: "DM care",
      sourcePolicy: {
        requiresFormulaVersion: true,
        requiresSourceReferences: true,
        requiresIndependentTestVectors: true,
        exportsClinicalCalculators: true,
      },
    });
  });

  it("keeps exported metadata aligned with the package manifest", () => {
    expect(dmCarePackageMetadata.version).toBe(packageManifest.version);
  });
});
