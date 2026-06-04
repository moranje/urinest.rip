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
      "Consumer Release Checklist",
      "Framework packages bevatten geen Supabase/admin/storage hardcoding",
      "Telemetry adapter is no-op zonder consumer config",
      "No-PHI telemetry contract is getest",
      "No-PHI storage contract is getest",
      "Anon log-ingest RPC weigert raw clinical telemetry keys",
      "CSP headers zijn enforcing en getest",
      "Source maps worden prive geupload en uit deploy artifact verwijderd",
      "Admin routes zijn app-only, lazy en auth-gated",
      "Malicious flow metadata",
    ]) {
      expect(guide).toContain(requiredPhrase);
    }
  });
});
