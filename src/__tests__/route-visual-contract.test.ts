import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function cssBlock(source: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    source.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`))?.groups?.body ??
    ""
  );
}

describe("route visual contracts", () => {
  it("keeps route views wired to template-level visual shells", () => {
    const landingPage = readFileSync("src/views/LandingPage.vue", "utf8");
    const questionnairePage = readFileSync("src/views/QuestionnairePage.vue", "utf8");
    const resultPage = readFileSync("src/views/ResultPage.vue", "utf8");
    const adminDashboard = readFileSync("src/views/admin/LogDashboard.vue", "utf8");
    const pageShell = readFileSync("src/components/templates/PageShell.vue", "utf8");

    expect(pageShell).toContain('<main id="main-content" class="app-content"');
    expect(landingPage).toContain("<LandingTemplate");
    expect(questionnairePage).toContain("<QuestionnaireTemplate");
    expect(questionnairePage).toContain(":is-grouped-step");
    expect(questionnairePage).toContain("@submit-group");
    expect(resultPage).toContain("<ResultTemplate");
    expect(adminDashboard).toContain("<AdminTemplate");
  });

  it("keeps app shell scroll and viewport ownership stable", () => {
    const pageShell = readFileSync("src/components/templates/PageShell.vue", "utf8");
    const appCss = cssBlock(pageShell, "#app");
    const contentCss = cssBlock(pageShell, ".app-content");
    const bodyCss = cssBlock(pageShell, "body");

    expect(appCss).toContain("display: grid");
    expect(appCss).toContain("grid-template-rows: auto 1fr");
    expect(appCss).toContain("height: 100dvh");
    expect(appCss).toContain("overflow: hidden");
    expect(contentCss).toContain("overflow-x: hidden");
    expect(contentCss).toContain("overflow-y: auto");
    expect(contentCss).toContain("contain: layout style paint");
    expect(bodyCss).toContain("overflow: hidden");
  });

  it("keeps landing route at desktop 2 rows by 3 columns", () => {
    const landingTemplate = readFileSync("src/components/templates/LandingTemplate.vue", "utf8");
    const primaryGridCss = cssBlock(landingTemplate, ":deep(.bm-landing-menu-grid__primary)");
    const primaryItemCss = cssBlock(landingTemplate, ":deep(.bm-landing-menu-grid__primary-item)");

    expect(primaryGridCss).toContain("five primary flows render as 2 rows x 3 columns");
    expect(primaryGridCss).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(primaryItemCss).toContain("max-inline-size: var(--landing-tile-size)");
    expect(primaryItemCss).toContain("aspect-ratio: 1 / 1");
    expect(landingTemplate).toContain("@container landing (max-width: 44rem)");
  });

  it("keeps questionnaire route transition, progress and grouped-input layout stable", () => {
    const questionnaireTemplate = readFileSync(
      "src/components/templates/QuestionnaireTemplate.vue",
      "utf8",
    );
    const questionnairePageController = readFileSync(
      "src/composables/useQuestionnairePageController.ts",
      "utf8",
    );
    const multiInputPanel = readFileSync("src/components/organisms/MultiInputPanel.vue", "utf8");
    const panelCss = cssBlock(questionnaireTemplate, ".questionnaire-template__panel");
    const pendingCss = cssBlock(questionnaireTemplate, ".questionnaire-template__pending");
    const gridCss = cssBlock(multiInputPanel, ".multi-input-panel__grid");
    const actionsCss = cssBlock(multiInputPanel, ".multi-input-panel__actions");

    expect(questionnaireTemplate).toContain(
      '<Transition v-else name="question-fade" mode="out-in">',
    );
    expect(questionnaireTemplate).toContain("<MultiInputPanel");
    expect(questionnaireTemplate).toContain("<QuestionPanel");
    expect(questionnaireTemplate).toContain(":progress-value");
    expect(questionnaireTemplate).toContain(":progress-max");
    expect(questionnaireTemplate).toContain("Resultaat bepalen");
    expect(panelCss).toContain("display: flex");
    expect(panelCss).toContain("flex-direction: column");
    expect(pendingCss).toContain("display: flex");
    expect(pendingCss).toContain("gap: var(--spacing-sm)");
    expect(gridCss).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(actionsCss).toContain("justify-content: flex-end");
    expect(multiInputPanel).toContain("@container questionnaire (max-width: 37.5rem)");
    expect(questionnairePageController).toContain("const pushNavigation = async");
    expect(questionnairePageController).toContain("isLoading.value = true;");
    expect(questionnairePageController).toContain(
      'await pushNavigation(`/questionnaire/${value}`, "router:questionnaire-redirect"',
    );
  });

  it("keeps result and admin routes bounded by content tokens", () => {
    const resultTemplate = readFileSync("src/components/templates/ResultTemplate.vue", "utf8");
    const adminTemplate = readFileSync("src/components/templates/AdminTemplate.vue", "utf8");
    const resultMainCss = cssBlock(resultTemplate, ".result-template__main");
    const resultContentCss = cssBlock(resultTemplate, ".result-template__content");
    const adminCss = cssBlock(adminTemplate, ".admin-template");
    const adminHeaderCss = cssBlock(adminTemplate, ".admin-template__header");

    expect(resultMainCss).toContain("max-width: var(--layout-content-max-width)");
    expect(resultMainCss).toContain("contain: layout style paint");
    expect(resultMainCss).toContain("container-name: result-main");
    expect(resultContentCss).toContain("display: flex");
    expect(resultTemplate).toContain("@media (prefers-reduced-motion: reduce)");
    expect(adminCss).toContain(
      "width: min(100% - var(--spacing-lg), var(--layout-content-max-width))",
    );
    expect(adminCss).toContain("container-name: admin");
    expect(adminHeaderCss).toContain("justify-content: space-between");
    expect(adminTemplate).toContain("@container admin (max-width: 37.5rem)");
  });
});
