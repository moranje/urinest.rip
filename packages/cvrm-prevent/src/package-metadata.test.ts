import { describe, expect, it } from "vitest";
import packageManifest from "../package.json" with { type: "json" };
import { cvrmPreventPackageMetadata } from "./package-metadata";

describe("cvrm prevent package metadata", () => {
  it("declares a verified domain package with enforced source policy", () => {
    expect(cvrmPreventPackageMetadata).toMatchObject({
      packageName: "@beslismodel/cvrm-prevent",
      status: "verified",
      domain: "CVRM/U-Prevent",
      sourcePolicy: {
        requiresFormulaVersion: true,
        requiresSourceReferences: true,
        requiresIndependentTestVectors: true,
        exportsClinicalCalculators: true,
      },
    });
  });

  it("keeps exported metadata aligned with the package manifest", () => {
    expect(cvrmPreventPackageMetadata.version).toBe(packageManifest.version);
  });
});
