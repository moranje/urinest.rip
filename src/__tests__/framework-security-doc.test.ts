import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const guide = readFileSync("docs/framework-security-privacy.md", "utf8");

describe("framework security and privacy documentation", () => {
  it("documents package boundaries, no-PHI contracts, CSP and source maps", () => {
    for (const requiredPhrase of [
      "Admin- en RLS-logica blijft app-only.",
      "No-PHI Telemetry Contract",
      "No-PHI Storage Contract",
      "CSP Guidance Voor Consumers",
      "Source Map Contract",
      "Upload source maps",
      "Remove source maps from deploy artifact",
      "service key alleen als CI-secret",
      "packages sturen alleen events naar een geinjecteerde telemetry adapter",
      "Malicious flow metadata",
    ]) {
      expect(guide).toContain(requiredPhrase);
    }
  });
});
