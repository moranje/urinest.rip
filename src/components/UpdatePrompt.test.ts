import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("UpdatePrompt", () => {
  it("delegates update sheet surface styling to Card while keeping dialog focus on the wrapper", () => {
    const source = readFileSync("src/components/UpdatePrompt.vue", "utf8");
    const sheetCss = source.match(/\.update-sheet\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body;

    expect(source).toContain("<Card");
    expect(source).toContain('class="update-sheet__surface"');
    expect(source).toContain('variant="elevated"');
    expect(source).toContain('ref="sheetRef"');
    expect(source).toContain('role="dialog"');
    expect(sheetCss).not.toContain("background:");
    expect(sheetCss).not.toContain("box-shadow:");
    expect(sheetCss).not.toContain("padding:");
  });
});
