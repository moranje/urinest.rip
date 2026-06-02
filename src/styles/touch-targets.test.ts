import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type TouchTargetCase = {
  file: string;
  source: string;
  selector: string;
  minWidth?: boolean;
};

function cssBlock(source: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`));
  expect(match?.groups?.body, `${selector} block is present`).toBeTruthy();
  return match?.groups?.body ?? "";
}

const tokensCss = readFileSync("src/styles/tokens.css", "utf8");
const menuItem = readFileSync("src/components/MenuItem.vue", "utf8");
const toastContainer = readFileSync("src/components/ToastContainer.vue", "utf8");
const sourceChip = readFileSync("src/components/molecules/SourceChip.vue", "utf8");
const adminLogList = readFileSync("src/components/organisms/AdminLogList.vue", "utf8");
const adminLogDetail = readFileSync("src/components/organisms/AdminLogDetail.vue", "utf8");
const adminLogin = readFileSync("src/views/admin/AdminLogin.vue", "utf8");

const appSpecificTargets: TouchTargetCase[] = [
  { file: "src/components/MenuItem.vue", source: menuItem, selector: ".menu-item" },
  {
    file: "src/components/ToastContainer.vue",
    source: toastContainer,
    selector: ".toast-close",
    minWidth: true,
  },
  { file: "src/components/molecules/SourceChip.vue", source: sourceChip, selector: ".source-chip" },
  {
    file: "src/components/organisms/AdminLogList.vue",
    source: adminLogList,
    selector: ".group-row",
  },
  {
    file: "src/components/organisms/AdminLogDetail.vue",
    source: adminLogDetail,
    selector: ".back-btn",
    minWidth: true,
  },
  {
    file: "src/components/organisms/AdminLogDetail.vue",
    source: adminLogDetail,
    selector: ".export-btn",
    minWidth: true,
  },
  {
    file: "src/components/organisms/AdminLogDetail.vue",
    source: adminLogDetail,
    selector: ".action-btn",
    minWidth: true,
  },
  {
    file: "src/components/organisms/AdminLogDetail.vue",
    source: adminLogDetail,
    selector: ".resolve-version-input",
  },
  { file: "src/views/admin/AdminLogin.vue", source: adminLogin, selector: "input" },
];

describe("touch target design rules", () => {
  it("defines the central touch target token at the accessibility minimum", () => {
    expect(tokensCss).toContain("--min-touch-target: 44px");
  });

  it("uses the shared token for app-specific interactive surfaces", () => {
    for (const target of appSpecificTargets) {
      const block = cssBlock(target.source, target.selector);

      expect(block, `${target.file} ${target.selector}`).toContain(
        "min-height: var(--min-touch-target)",
      );
      expect(block, `${target.file} ${target.selector}`).not.toMatch(
        /min-height:\s*(?:3[0-9]|4[0-3])px/,
      );

      if (target.minWidth) {
        expect(block, `${target.file} ${target.selector}`).toContain(
          "min-width: var(--min-touch-target)",
        );
        expect(block, `${target.file} ${target.selector}`).not.toMatch(
          /min-width:\s*(?:3[0-9]|4[0-3])px/,
        );
      }
    }
  });
});
