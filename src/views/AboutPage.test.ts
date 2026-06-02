import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("AboutPage", () => {
  it("uses TextLink for external references instead of raw blank anchors", () => {
    const source = readFileSync("src/views/AboutPage.vue", "utf8");

    expect(source).toContain("<TextLink");
    expect(source).toContain("import TextLink");
    expect(source).not.toContain('target="_blank"');
    expect(source).not.toMatch(/<a\s/i);
  });
});
