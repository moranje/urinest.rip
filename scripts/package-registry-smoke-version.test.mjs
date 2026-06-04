import { describe, expect, it } from "vitest";
import {
  assertRegistrySmokeVersion,
  packageReleaseVersionPattern,
} from "./package-registry-smoke-version.mjs";

const oneVersion = (version) => new Set([version]);

describe("package registry smoke version policy", () => {
  it("accepts exact prerelease package versions", () => {
    expect(() =>
      assertRegistrySmokeVersion({
        version: "0.1.0-next.1",
        expectedVersion: "0.1.0-next.1",
        expectedVersions: oneVersion("0.1.0-next.1"),
      }),
    ).not.toThrow();
  });

  it("accepts exact stable package versions for latest smoke", () => {
    expect(packageReleaseVersionPattern.test("0.1.0")).toBe(true);
    expect(() =>
      assertRegistrySmokeVersion({
        version: "0.1.0",
        expectedVersion: "0.1.0",
        expectedVersions: oneVersion("0.1.0"),
      }),
    ).not.toThrow();
  });

  it("rejects shorthand or invalid semver strings", () => {
    expect(() =>
      assertRegistrySmokeVersion({
        version: "0.1",
        expectedVersion: "0.1",
        expectedVersions: oneVersion("0.1"),
      }),
    ).toThrow("stable semver or semver prerelease");
  });

  it("rejects version mismatches before registry install", () => {
    expect(() =>
      assertRegistrySmokeVersion({
        version: "0.1.0",
        expectedVersion: "0.1.0-next.1",
        expectedVersions: oneVersion("0.1.0-next.1"),
      }),
    ).toThrow("must equal package version 0.1.0-next.1");
  });

  it("rejects mixed package versions", () => {
    expect(() =>
      assertRegistrySmokeVersion({
        version: "0.1.0",
        expectedVersion: "0.1.0",
        expectedVersions: new Set(["0.1.0", "0.1.1"]),
      }),
    ).toThrow("requires one package version");
  });

  it("requires an explicit or current package version", () => {
    expect(() =>
      assertRegistrySmokeVersion({
        version: "",
        expectedVersion: "0.1.0-next.1",
        expectedVersions: oneVersion("0.1.0-next.1"),
      }),
    ).toThrow("BESLISMODEL_REGISTRY_SMOKE_VERSION is required");
  });
});
