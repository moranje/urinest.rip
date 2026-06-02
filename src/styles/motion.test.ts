/* eslint-disable security/detect-non-literal-fs-filename */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("motion utilities", () => {
  it("loads central motion utilities after design tokens", () => {
    const mainCss = read("src/styles/main.css");

    expect(mainCss).toContain('@import "./tokens.css" layer(tokens)');
    expect(mainCss).toContain('@import "./motion.css" layer(utilities)');
  });

  it("defines per-utility reduced-motion hard stops", () => {
    const motionCss = read("src/styles/motion.css");
    const reducedBlock = motionCss.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{(?<body>[\s\S]*)\n\}/,
    )?.groups?.body;

    expect(motionCss).toContain(".motion-spin");
    expect(motionCss).toContain(".motion-shimmer-sweep::after");
    expect(reducedBlock).toBeDefined();
    expect(reducedBlock).toContain(".motion-spin");
    expect(reducedBlock).toContain("animation: none");
    expect(reducedBlock).toContain(".motion-shimmer-sweep::after");
    expect(reducedBlock).toContain("will-change: auto");
  });

  it("keeps spinner and shimmer keyframes out of scoped consumers", () => {
    const files = [
      "src/components/primitives/Button.vue",
      "src/components/primitives/Icon.vue",
      "src/components/primitives/Skeleton.vue",
      "src/components/templates/QuestionnaireTemplate.vue",
      "src/components/organisms/AdminLogList.vue",
      "src/components/organisms/AdminLogDetail.vue",
      "src/styles/main.css",
    ];

    const offenders = files.filter((file) => {
      const source = read(file);
      return /@keyframes\s+(spin|btn-spin|icon-spin|questionnaire-template-spin|skeleton-shimmer)\b/.test(
        source,
      );
    });

    expect(offenders).toEqual([]);
  });
});
