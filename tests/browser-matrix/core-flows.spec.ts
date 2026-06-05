import { expect, test } from "@playwright/test";

async function expectQuestionPath(page, pathname: string, queryFragment: string, heading: string) {
  await expect(page).toHaveURL((url) => {
    return url.pathname === pathname && url.search.includes(queryFragment);
  });
  await page.waitForFunction((expectedHeading) => {
    const visibleHeadings = [...document.querySelectorAll("h1")].filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        rect.width > 0 &&
        rect.height > 0
      );
    });

    return (
      visibleHeadings.length === 1 && visibleHeadings[0]?.textContent?.includes(expectedHeading)
    );
  }, heading);
}

test.describe("browser platform matrix", () => {
  test("keeps the landing grid as 2 rows x 3 columns on desktop", async ({ page }) => {
    await page.goto("/");
    await page.locator(".bm-landing-menu-grid__primary-item").first().waitFor();

    const grid = await page.evaluate(() => {
      const primary = document.querySelector(".bm-landing-menu-grid__primary");
      const items = [...document.querySelectorAll(".bm-landing-menu-grid__primary-item")];
      const style = primary ? getComputedStyle(primary) : null;
      const rects = items.map((item) => {
        const rect = item.getBoundingClientRect();
        return {
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          width: Math.round(rect.width),
        };
      });
      const rows = [];
      for (const rect of rects) {
        const row = rows.find((candidate) => Math.abs(candidate.top - rect.top) <= 8);
        if (row) row.items.push(rect);
        else rows.push({ top: rect.top, items: [rect] });
      }
      rows.sort((a, b) => a.top - b.top);

      return {
        columns: style?.gridTemplateColumns.split(" ").filter(Boolean).length ?? 0,
        count: items.length,
        rowCount: rows.length,
        rowSizes: rows.map((row) => row.items.length),
        tileHeights: rects.map((rect) => rect.height),
        tileWidths: rects.map((rect) => rect.width),
      };
    });

    expect(grid.count).toBe(5);
    expect(grid.columns).toBe(3);
    expect(grid.rowCount).toBe(2);
    expect(grid.rowSizes).toEqual([3, 2]);
    expect(grid.tileWidths.every((width) => width >= 250 && width <= 340)).toBe(true);
    expect(grid.tileHeights.every((height) => height >= 250 && height <= 340)).toBe(true);
  });

  test("loads direct result routes without hanging on a loader", async ({ page }) => {
    await page.goto("/info/uti.local.healthy.1");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Cystitis: Gezonde vrouw");
    await expect(page.getByText("Resultaat bepalen")).toHaveCount(0);
    await expect(page.getByText("Vragenlijst laden")).toHaveCount(0);
  });

  test("keeps native browser history for questionnaire jumps", async ({ page }) => {
    await page.goto("/questionnaire/strip");
    await expectQuestionPath(page, "/questionnaire/strip", "q=q_strip_nitrite", "Nitriet test");

    await page.getByRole("radio", { name: /Positief/ }).click();
    await expectQuestionPath(
      page,
      "/questionnaire/bacteriurie",
      "q=q_bac_tissue",
      "Is er sprake van weefselinvasie?",
    );

    await page.goBack();
    await expectQuestionPath(page, "/questionnaire/strip", "q=q_strip_nitrite", "Nitriet test");

    await page.goForward();
    await expectQuestionPath(
      page,
      "/questionnaire/bacteriurie",
      "q=q_bac_tissue",
      "Is er sprake van weefselinvasie?",
    );

    await page.reload();
    await expectQuestionPath(
      page,
      "/questionnaire/bacteriurie",
      "q=q_bac_tissue",
      "Is er sprake van weefselinvasie?",
    );
  });
});
