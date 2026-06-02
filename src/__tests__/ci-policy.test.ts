import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(resolve(".github/workflows/ci.yml"), "utf8");

describe("CI policy", () => {
  it("keeps dependency audit, secret scanning, package and bundle gates active", () => {
    expect(workflow).toContain("npm audit --omit=dev --audit-level=high");
    expect(workflow).toContain("Possible hardcoded JWT/key found in source code");
    expect(workflow).toContain("git ls-files --error-unmatch .env");
    expect(workflow).toContain("npm run check:packages");
    expect(workflow).toContain("npm run budget");
    expect(workflow).toContain("npm run build-storybook");
  });
});
