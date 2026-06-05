import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import process from "node:process";
import puppeteer from "puppeteer-core";

const chromeCandidates = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean);

const chromePath = chromeCandidates.find((candidate) => existsSync(candidate));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === "string") reject(new Error("Could not allocate port"));
        else resolve(address.port);
      });
    });
  });
}

function isIgnoredBrowserRequest(url) {
  return url === "https://stats.oranje.wtf/script.js";
}

async function waitForHttp(url, timeoutMs = 30_000) {
  const startedAt = Date.now();
  let lastError = "";
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

function signalPreviewServer(server, signal) {
  if (!server.pid) return;
  try {
    if (process.platform !== "win32") process.kill(-server.pid, signal);
    else server.kill(signal);
  } catch {
    server.kill(signal);
  }
}

async function stopPreviewServer(server) {
  if (server.exitCode !== null || server.signalCode !== null) return;

  const waitForExit = (timeoutMs) =>
    new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), timeoutMs);
      server.once("exit", () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });

  signalPreviewServer(server, "SIGTERM");
  if (await waitForExit(1_500)) return;
  if (server.exitCode !== null || server.signalCode !== null) return;

  signalPreviewServer(server, "SIGKILL");
  await waitForExit(1_000);
}

async function withPreviewServer(callback) {
  if (process.env.BESLISMODEL_BROWSER_SMOKE_URL) {
    await callback(process.env.BESLISMODEL_BROWSER_SMOKE_URL.replace(/\/$/u, ""));
    return;
  }

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawn(
    "npm",
    ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      detached: process.platform !== "win32",
      env: { ...process.env, BROWSER: "none" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let logs = "";
  server.stdout.on("data", (chunk) => {
    logs += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    logs += chunk.toString();
  });

  try {
    await waitForHttp(baseUrl);
    await callback(baseUrl);
  } catch (error) {
    const detail = logs.trim().split("\n").slice(-20).join("\n");
    if (detail) console.error(detail);
    throw error;
  } finally {
    await stopPreviewServer(server);
  }
}

async function expectHeading(page, text) {
  await page.waitForFunction(
    (expected) => document.querySelector("h1")?.textContent?.includes(expected),
    { timeout: 10_000 },
    text,
  );
}

async function resetClientStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function assertLandingGrid(page, baseUrl) {
  await page.setViewport({ width: 1714, height: 1200, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".bm-landing-menu-grid__primary-item", { timeout: 10_000 });

  const grid = await page.evaluate(() => {
    const primary = document.querySelector(".bm-landing-menu-grid__primary");
    const items = [...document.querySelectorAll(".bm-landing-menu-grid__primary-item")];
    const style = primary ? getComputedStyle(primary) : null;
    const rects = items.map((item) => {
      const rect = item.getBoundingClientRect();
      return {
        height: Math.round(rect.height),
        left: Math.round(rect.left),
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

  assert(grid.count === 5, `Expected 5 primary landing items, received ${grid.count}`);
  assert(grid.columns === 3, `Expected 3 desktop landing columns, received ${grid.columns}`);
  assert(grid.rowCount === 2, `Expected 2 desktop landing rows, received ${grid.rowCount}`);
  assert(
    grid.rowSizes[0] === 3 && grid.rowSizes[1] === 2,
    `Expected landing rows 3+2, received ${grid.rowSizes.join("+")}`,
  );
  assert(
    grid.tileWidths.every((width) => width >= 250 && width <= 340),
    `Unexpected desktop landing tile widths: ${grid.tileWidths.join(", ")}`,
  );
  assert(
    grid.tileHeights.every((height) => height >= 250 && height <= 340),
    `Unexpected desktop landing tile heights: ${grid.tileHeights.join(", ")}`,
  );
}

function hexToRgbString(hex) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
}

async function assertThemeModes(page, baseUrl) {
  const tokens = {
    darkBackground: hexToRgbString("#1a1c1e"),
    darkTheme: "#005a2b",
    lightBackground: hexToRgbString("#fcfcff"),
    lightTheme: "#16a34a",
  };

  async function loadTheme(colorScheme) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: colorScheme }]);
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
    await page.waitForSelector(".bm-landing-menu-grid__primary-item", { timeout: 10_000 });

    return page.evaluate(() => ({
      background: getComputedStyle(document.body).backgroundColor,
      dataTheme: document.documentElement.getAttribute("data-theme"),
      themeControlCount: document.querySelectorAll('[aria-label*="thema" i], [title*="thema" i]')
        .length,
      metas: [...document.querySelectorAll('meta[name="theme-color"]')].map((meta) => ({
        content: meta.getAttribute("content") ?? "",
        media: meta.getAttribute("media") ?? "",
      })),
    }));
  }

  const light = await loadTheme("light");
  assert(light.dataTheme === "light", `System light data-theme mismatch: ${light.dataTheme}`);
  assert(light.themeControlCount === 0, "Theme mode control should not render in production UI");
  assert(
    light.background === tokens.lightBackground,
    `System light background mismatch: ${light.background}`,
  );
  assert(
    light.metas.some(
      (meta) => meta.media.includes("light") && meta.content === tokens.lightTheme,
    ) &&
      light.metas.some((meta) => meta.media.includes("dark") && meta.content === tokens.darkTheme),
    `System light theme-color mismatch: ${JSON.stringify(light.metas)}`,
  );

  const dark = await loadTheme("dark");
  assert(dark.dataTheme === "dark", `System dark data-theme mismatch: ${dark.dataTheme}`);
  assert(dark.themeControlCount === 0, "Theme mode control should not render in production UI");
  assert(
    dark.background === tokens.darkBackground,
    `System dark background mismatch: ${dark.background}`,
  );
  assert(
    dark.metas.some((meta) => meta.media.includes("light") && meta.content === tokens.lightTheme) &&
      dark.metas.some((meta) => meta.media.includes("dark") && meta.content === tokens.darkTheme),
    `System dark theme-color mismatch: ${JSON.stringify(dark.metas)}`,
  );
}

async function assertReducedMotionRouteTransitions(page, baseUrl) {
  async function installViewTransitionCounter() {
    await page.evaluate(() => {
      window.__beslismodelViewTransitionCalls = 0;
      Object.defineProperty(document, "startViewTransition", {
        configurable: true,
        value: (callback) => {
          window.__beslismodelViewTransitionCalls += 1;
          const updateCallbackDone = Promise.resolve().then(callback);
          return {
            finished: updateCallbackDone.then(() => undefined),
            ready: Promise.resolve(),
            updateCallbackDone,
          };
        },
      });
    });
  }

  async function navigateToAboutWithMotionPreference(preference) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: preference }]);
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
    await page.waitForSelector('[aria-label="Over deze beslishulp"]', { timeout: 10_000 });
    await installViewTransitionCounter();
    await page.click('[aria-label="Over deze beslishulp"]');
    await page.waitForFunction(
      () =>
        location.pathname === "/over" &&
        document.querySelector("h1")?.textContent?.includes("Over dit project"),
      { timeout: 10_000 },
    );
    return page.evaluate(() => ({
      calls: window.__beslismodelViewTransitionCalls,
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    }));
  }

  const reduced = await navigateToAboutWithMotionPreference("reduce");
  assert(reduced.reduced, "Reduced-motion media emulation did not activate");
  assert(
    reduced.calls === 0,
    `Reduced motion route transition used View Transitions ${reduced.calls} time(s)`,
  );

  const noPreference = await navigateToAboutWithMotionPreference("no-preference");
  assert(!noPreference.reduced, "No-preference media emulation did not reset reduced motion");
  assert(
    noPreference.calls === 1,
    `No-preference route transition did not use View Transitions once: ${noPreference.calls}`,
  );
}

async function clickChoice(page, label) {
  const clicked = await page.evaluate((text) => {
    const options = [...document.querySelectorAll('[role="radio"], [role="checkbox"]')];
    const option = options.find((candidate) => candidate.textContent?.includes(text));
    if (!(option instanceof HTMLElement)) return false;
    option.click();
    return true;
  }, label);
  assert(clicked, `Choice not found: ${label}`);
}

async function expectChoiceSelected(page, label) {
  const selected = await page.evaluate((text) => {
    const options = [...document.querySelectorAll('[role="radio"], [role="checkbox"]')];
    const option = options.find((candidate) => candidate.textContent?.includes(text));
    return option?.getAttribute("aria-checked") === "true";
  }, label);
  assert(selected, `Choice not restored as selected after history navigation: ${label}`);
}

async function expectQuestionPath(page, pathname, queryFragment, heading) {
  await page.waitForFunction(
    (expectedPathname, expectedQueryFragment, expectedHeading) =>
      location.pathname === expectedPathname &&
      location.search.includes(expectedQueryFragment) &&
      document.querySelector("h1")?.textContent?.includes(expectedHeading),
    { timeout: 10_000 },
    pathname,
    queryFragment,
    heading,
  );
}

async function assertQuestionnaireNavigation(page, baseUrl) {
  await page.goto(`${baseUrl}/questionnaire/strip`, { waitUntil: "domcontentloaded" });
  await expectHeading(page, "Nitriet test");

  const answerUi = await page.evaluate(() => {
    const px = (value) => Number.parseFloat(value || "0");
    const option = document.querySelector(".choice-option");
    const button = document.querySelector(".choice-option__button");
    const optionStyle = option ? getComputedStyle(option) : null;
    const buttonStyle = button ? getComputedStyle(button) : null;
    return {
      buttonBorderWidths: buttonStyle
        ? [
            px(buttonStyle.borderTopWidth),
            px(buttonStyle.borderRightWidth),
            px(buttonStyle.borderBottomWidth),
            px(buttonStyle.borderLeftWidth),
          ]
        : [],
      optionBorderWidths: optionStyle
        ? [
            px(optionStyle.borderTopWidth),
            px(optionStyle.borderRightWidth),
            px(optionStyle.borderBottomWidth),
            px(optionStyle.borderLeftWidth),
          ]
        : [],
    };
  });
  assert(
    answerUi.optionBorderWidths.length === 4 &&
      answerUi.optionBorderWidths.every((width) => width === 0),
    `Answer option shell has unwanted border widths: ${answerUi.optionBorderWidths.join(", ")}`,
  );
  assert(
    answerUi.buttonBorderWidths.length === 4 &&
      answerUi.buttonBorderWidths.every((width) => width === 0),
    `Answer option button has unwanted border widths: ${answerUi.buttonBorderWidths.join(", ")}`,
  );

  const forcedColorsClient = await page.createCDPSession();
  await forcedColorsClient.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  const forcedColorAnswerUi = await page.evaluate(() => {
    const px = (value) => Number.parseFloat(value || "0");
    const option = document.querySelector(".choice-option");
    const button = document.querySelector(".choice-option__button");
    const optionStyle = option ? getComputedStyle(option) : null;
    const buttonStyle = button ? getComputedStyle(button) : null;
    return {
      buttonBorderWidths: buttonStyle
        ? [
            px(buttonStyle.borderTopWidth),
            px(buttonStyle.borderRightWidth),
            px(buttonStyle.borderBottomWidth),
            px(buttonStyle.borderLeftWidth),
          ]
        : [],
      optionBorderWidths: optionStyle
        ? [
            px(optionStyle.borderTopWidth),
            px(optionStyle.borderRightWidth),
            px(optionStyle.borderBottomWidth),
            px(optionStyle.borderLeftWidth),
          ]
        : [],
    };
  });
  await forcedColorsClient.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "none" }],
  });
  await forcedColorsClient.detach();
  assert(
    forcedColorAnswerUi.optionBorderWidths.length === 4 &&
      forcedColorAnswerUi.optionBorderWidths.every((width) => width === 0),
    `Forced-colors answer option shell has unwanted border widths: ${forcedColorAnswerUi.optionBorderWidths.join(", ")}`,
  );
  assert(
    forcedColorAnswerUi.buttonBorderWidths.length === 4 &&
      forcedColorAnswerUi.buttonBorderWidths.every((width) => width === 0),
    `Forced-colors answer option button has unwanted border widths: ${forcedColorAnswerUi.buttonBorderWidths.join(", ")}`,
  );

  const progress = await page.evaluate(() => ({
    ariaLabel: document.querySelector('[role="progressbar"]')?.getAttribute("aria-label") ?? "",
    text: document.querySelector('[role="progressbar"]')?.textContent?.trim() ?? "",
  }));
  assert(
    progress.ariaLabel === "Indicatieve voortgang door vragenlijst",
    `Unexpected progress label: ${progress.ariaLabel}`,
  );
  assert(
    progress.text === "",
    `Progress text should stay visually empty, received: ${progress.text}`,
  );

  await clickChoice(page, "Positief");
  await expectQuestionPath(
    page,
    "/questionnaire/bacteriurie",
    "q=q_bac_tissue",
    "Is er sprake van weefselinvasie?",
  );

  await page.goBack({ waitUntil: "domcontentloaded" });
  await expectQuestionPath(page, "/questionnaire/strip", "q=q_strip_nitrite", "Nitriet test");
  await expectChoiceSelected(page, "Positief");
}

async function assertQuestionnaireDeepBackStack(page, baseUrl) {
  await resetClientStorage(page);
  await page.goto(`${baseUrl}/questionnaire/strip`, { waitUntil: "domcontentloaded" });
  await expectHeading(page, "Nitriet test");

  await clickChoice(page, "Positief");
  await expectQuestionPath(
    page,
    "/questionnaire/bacteriurie",
    "q=q_bac_tissue",
    "Is er sprake van weefselinvasie?",
  );

  await clickChoice(page, "Geen");
  await expectQuestionPath(
    page,
    "/questionnaire/bacteriurie",
    "q=q_bac_risk",
    "Behoort patiënt tot een risicogroep?",
  );

  await clickChoice(page, "Nee");
  await expectQuestionPath(
    page,
    "/questionnaire/bacteriurie",
    "q=q_bac_catheter",
    "Heeft patiënt een urine katheter?",
  );

  await clickChoice(page, "Nee");
  await expectQuestionPath(
    page,
    "/questionnaire/bacteriurie",
    "q=q_bac_tx_local_healthy",
    "Welke behandeling kan patiënt krijgen?",
  );

  await page.goBack({ waitUntil: "domcontentloaded" });
  await expectQuestionPath(
    page,
    "/questionnaire/bacteriurie",
    "q=q_bac_catheter",
    "Heeft patiënt een urine katheter?",
  );
  await expectChoiceSelected(page, "Nee");

  await page.goBack({ waitUntil: "domcontentloaded" });
  await expectQuestionPath(
    page,
    "/questionnaire/bacteriurie",
    "q=q_bac_risk",
    "Behoort patiënt tot een risicogroep?",
  );
  await expectChoiceSelected(page, "Nee");

  await page.goBack({ waitUntil: "domcontentloaded" });
  await expectQuestionPath(
    page,
    "/questionnaire/bacteriurie",
    "q=q_bac_tissue",
    "Is er sprake van weefselinvasie?",
  );
  await expectChoiceSelected(page, "Geen");

  await page.goBack({ waitUntil: "domcontentloaded" });
  await expectQuestionPath(page, "/questionnaire/strip", "q=q_strip_nitrite", "Nitriet test");
  await expectChoiceSelected(page, "Positief");
}

async function navigateToHealthyTreatmentQuestion(page, baseUrl) {
  await page.goto(`${baseUrl}/questionnaire/strip`, { waitUntil: "domcontentloaded" });
  await expectHeading(page, "Nitriet test");
  await clickChoice(page, "Positief");
  await expectQuestionPath(
    page,
    "/questionnaire/bacteriurie",
    "q=q_bac_tissue",
    "Is er sprake van weefselinvasie?",
  );
  await clickChoice(page, "Geen");
  await expectQuestionPath(
    page,
    "/questionnaire/bacteriurie",
    "q=q_bac_risk",
    "Behoort patiënt tot een risicogroep?",
  );
  await clickChoice(page, "Nee");
  await expectQuestionPath(
    page,
    "/questionnaire/bacteriurie",
    "q=q_bac_catheter",
    "Heeft patiënt een urine katheter?",
  );
  await clickChoice(page, "Nee");
  await expectQuestionPath(
    page,
    "/questionnaire/bacteriurie",
    "q=q_bac_tx_local_healthy",
    "Welke behandeling kan patiënt krijgen?",
  );
}

async function assertInfoPopoverViewportFit(page, baseUrl) {
  await resetClientStorage(page);
  await page.setViewport({ width: 390, height: 420, deviceScaleFactor: 1 });
  await navigateToHealthyTreatmentQuestion(page, baseUrl);

  const opened = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('[data-testid="choice-option-info"]')];
    const button = buttons.find((candidate) =>
      candidate.closest(".choice-option")?.textContent?.includes("Trimethoprim"),
    );
    if (!(button instanceof HTMLElement)) return false;
    button.click();
    return true;
  });
  assert(opened, "Trimethoprim info button not found for viewport-fit check");
  await page.waitForSelector('[role="dialog"][aria-label="Meer informatie"]', {
    timeout: 10_000,
  });

  const popoverRect = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Meer informatie"]');
    if (!(dialog instanceof HTMLElement)) return null;
    const rect = dialog.getBoundingClientRect();
    const style = getComputedStyle(dialog);
    return {
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      maxHeight: Number.parseFloat(style.maxHeight || "0"),
      right: rect.right,
      top: rect.top,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    };
  });
  assert(popoverRect, "Info popover missing for viewport-fit measurement");
  assert(
    popoverRect.left >= 8 &&
      popoverRect.top >= 8 &&
      popoverRect.right <= popoverRect.viewportWidth - 8 &&
      popoverRect.bottom <= popoverRect.viewportHeight - 8,
    `Info popover escaped mobile viewport: ${JSON.stringify(popoverRect)}`,
  );
  assert(
    popoverRect.maxHeight <= popoverRect.viewportHeight - 32,
    `Info popover max-height ignores viewport: ${JSON.stringify(popoverRect)}`,
  );
}

async function assertInfoPopoverInteraction(page, baseUrl) {
  await resetClientStorage(page);
  await navigateToHealthyTreatmentQuestion(page, baseUrl);

  const beforeUrl = page.url();
  const selectedBefore = await page.evaluate(() =>
    [...document.querySelectorAll('[role="radio"][aria-checked="true"]')].map((node) =>
      node.textContent?.trim(),
    ),
  );
  const opened = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('[data-testid="choice-option-info"]')];
    const button = buttons.find((candidate) =>
      candidate.closest(".choice-option")?.textContent?.includes("Trimethoprim"),
    );
    if (!(button instanceof HTMLElement)) return false;
    button.click();
    return true;
  });
  assert(opened, "Trimethoprim info button not found");

  await page.waitForSelector('[role="dialog"][aria-label="Meer informatie"]', {
    timeout: 10_000,
  });
  try {
    await page.waitForFunction(
      () =>
        document.activeElement?.getAttribute("role") === "dialog" &&
        document.activeElement?.getAttribute("aria-label") === "Meer informatie",
      { timeout: 10_000 },
    );
  } catch (error) {
    const focusDebug = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-label="Meer informatie"]');
      return {
        activeClasses: document.activeElement?.className?.toString() ?? "",
        activeLabel: document.activeElement?.getAttribute("aria-label") ?? "",
        activeRole: document.activeElement?.getAttribute("role") ?? "",
        dialogExists: Boolean(dialog),
        dialogTabindex: dialog?.getAttribute("tabindex") ?? "",
      };
    });
    throw new Error(
      `Info popover did not receive focus after click-open: ${JSON.stringify(focusDebug)}; ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  const focusAfterOpen = await page.evaluate(() => ({
    label: document.activeElement?.getAttribute("aria-label") ?? "",
    role: document.activeElement?.getAttribute("role") ?? "",
  }));
  assert(
    focusAfterOpen.role === "dialog" && focusAfterOpen.label === "Meer informatie",
    `Info popover did not receive focus after click-open: ${JSON.stringify(focusAfterOpen)}`,
  );

  const afterOpen = await page.evaluate(() => {
    const trimethoprimOption = [...document.querySelectorAll(".choice-option")].find((candidate) =>
      candidate.textContent?.includes("Trimethoprim"),
    );
    return {
      selected: [...document.querySelectorAll('[role="radio"][aria-checked="true"]')].map((node) =>
        node.textContent?.trim(),
      ),
      text:
        document.querySelector('[role="dialog"][aria-label="Meer informatie"]')?.textContent ?? "",
      trimethoprimChecked:
        trimethoprimOption?.querySelector('[role="radio"]')?.getAttribute("aria-checked") ?? "",
      url: location.href,
    };
  });
  assert(afterOpen.url === beforeUrl, "Info popover click changed the questionnaire URL");
  assert(
    JSON.stringify(afterOpen.selected) === JSON.stringify(selectedBefore),
    "Info popover click changed answer selection",
  );
  assert(afterOpen.trimethoprimChecked === "false", "Info popover click selected Trimethoprim");
  assert(afterOpen.text.includes("3e keuze"), "Info popover did not show treatment info text");

  await page.click('[role="dialog"][aria-label="Meer informatie"]');
  const keptOpenAfterInsideClick = await page.evaluate(() =>
    Boolean(document.querySelector('[role="dialog"][aria-label="Meer informatie"]')),
  );
  assert(keptOpenAfterInsideClick, "Info popover closed after clicking inside the dialog");

  await page.click('[data-testid="info-popover-close"]');
  await page.waitForFunction(
    () => !document.querySelector('[role="dialog"][aria-label="Meer informatie"]'),
    { timeout: 10_000 },
  );
  const focusReturned = await page.evaluate(() => {
    const active = document.activeElement;
    return (
      active instanceof HTMLElement &&
      active.matches('[data-testid="choice-option-info"]') &&
      Boolean(active.closest(".choice-option")?.textContent?.includes("Trimethoprim"))
    );
  });
  assert(focusReturned, "Info popover close did not restore focus to the answer info button");

  const reopened = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('[data-testid="choice-option-info"]')];
    const button = buttons.find((candidate) =>
      candidate.closest(".choice-option")?.textContent?.includes("Trimethoprim"),
    );
    if (!(button instanceof HTMLElement)) return false;
    button.click();
    return true;
  });
  assert(reopened, "Trimethoprim info button not found for outside-click check");
  await page.waitForSelector('[role="dialog"][aria-label="Meer informatie"]', {
    timeout: 10_000,
  });
  await page.click("h1");
  await page.waitForFunction(
    () => !document.querySelector('[role="dialog"][aria-label="Meer informatie"]'),
    { timeout: 10_000 },
  );

  const reopenedForKeyboard = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('[data-testid="choice-option-info"]')];
    const button = buttons.find((candidate) =>
      candidate.closest(".choice-option")?.textContent?.includes("Trimethoprim"),
    );
    if (!(button instanceof HTMLElement)) return false;
    button.click();
    return true;
  });
  assert(reopenedForKeyboard, "Trimethoprim info button not found for keyboard navigation check");
  await page.waitForSelector('[role="dialog"][aria-label="Meer informatie"]', {
    timeout: 10_000,
  });
  await page.keyboard.press("A");
  await page.waitForFunction(
    () => location.pathname.startsWith("/info/") && document.querySelector("h1"),
    { timeout: 10_000 },
  );
  const stalePopover = await page.evaluate(() =>
    Boolean(document.querySelector('[role="dialog"][aria-label="Meer informatie"]')),
  );
  assert(!stalePopover, "Info popover stayed visible after keyboard answer navigation");

  await page.goBack({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () =>
      location.pathname === "/questionnaire/bacteriurie" &&
      location.search.includes("q=q_bac_tx_local_healthy") &&
      document.querySelector("h1")?.textContent?.includes("Welke behandeling kan patiënt krijgen?"),
    { timeout: 10_000 },
  );
}

async function assertDirectResultRoute(page, baseUrl) {
  await page.setViewport({ width: 1714, height: 1200, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/info/uti.local.healthy.1`, { waitUntil: "domcontentloaded" });
  await expectHeading(page, "Cystitis: Gezonde vrouw");

  const text = await page.evaluate(() => document.body.textContent ?? "");
  assert(!text.includes("Resultaat bepalen"), "Direct result route stayed stuck on loader");
  assert(!text.includes("Vragenlijst laden"), "Direct result route stayed stuck on shell loader");

  const resultUi = await page.evaluate(() => {
    const px = (value) => Number.parseFloat(value || "0");
    const notice = document.querySelector(".contraindication-notice");
    const warning = document.querySelector(".notice--warning");
    const checkboxField = document.querySelector(".checkbox-field");
    const checkboxBox = document.querySelector(".checkbox-field__box");
    const noticeStyle = notice ? getComputedStyle(notice) : null;
    const warningStyle = warning ? getComputedStyle(warning) : null;
    const checkboxFieldStyle = checkboxField ? getComputedStyle(checkboxField) : null;
    const checkboxBoxStyle = checkboxBox ? getComputedStyle(checkboxBox) : null;

    return {
      checkboxFieldBorderWidths: checkboxFieldStyle
        ? [
            px(checkboxFieldStyle.borderTopWidth),
            px(checkboxFieldStyle.borderRightWidth),
            px(checkboxFieldStyle.borderBottomWidth),
            px(checkboxFieldStyle.borderLeftWidth),
          ]
        : [],
      checkboxBorderWidths: checkboxBoxStyle
        ? [
            px(checkboxBoxStyle.borderTopWidth),
            px(checkboxBoxStyle.borderRightWidth),
            px(checkboxBoxStyle.borderBottomWidth),
            px(checkboxBoxStyle.borderLeftWidth),
          ]
        : [],
      checkboxBoxShadow: checkboxBoxStyle?.boxShadow ?? "",
      noticeBorderWidths: noticeStyle
        ? [
            px(noticeStyle.borderTopWidth),
            px(noticeStyle.borderRightWidth),
            px(noticeStyle.borderBottomWidth),
            px(noticeStyle.borderLeftWidth),
          ]
        : [],
      noticePadding: noticeStyle
        ? {
            blockEnd: px(noticeStyle.paddingBlockEnd),
            blockStart: px(noticeStyle.paddingBlockStart),
            inlineEnd: px(noticeStyle.paddingInlineEnd),
            inlineStart: px(noticeStyle.paddingInlineStart),
          }
        : null,
      warningBorderWidths: warningStyle
        ? [
            px(warningStyle.borderTopWidth),
            px(warningStyle.borderRightWidth),
            px(warningStyle.borderBottomWidth),
            px(warningStyle.borderLeftWidth),
          ]
        : [],
      warningPadding: warningStyle
        ? {
            blockEnd: px(warningStyle.paddingBlockEnd),
            blockStart: px(warningStyle.paddingBlockStart),
            inlineEnd: px(warningStyle.paddingInlineEnd),
            inlineStart: px(warningStyle.paddingInlineStart),
          }
        : null,
    };
  });

  assert(
    resultUi.checkboxFieldBorderWidths.length === 4 &&
      resultUi.checkboxFieldBorderWidths.every((width) => width === 0),
    `Result checkbox field has unwanted border widths: ${resultUi.checkboxFieldBorderWidths.join(", ")}`,
  );
  assert(
    resultUi.checkboxBorderWidths.length === 4 &&
      resultUi.checkboxBorderWidths.every((width) => width === 0),
    `Result checkbox visual has unwanted border widths: ${resultUi.checkboxBorderWidths.join(", ")}`,
  );
  assert(
    resultUi.checkboxBoxShadow === "none",
    `Result checkbox visual has unwanted shadow: ${resultUi.checkboxBoxShadow}`,
  );
  assert(
    resultUi.noticeBorderWidths.length === 4 &&
      resultUi.noticeBorderWidths.every((width) => width === 0),
    `Contraindication notice has unwanted border widths: ${resultUi.noticeBorderWidths.join(", ")}`,
  );
  assert(
    resultUi.warningBorderWidths.length === 4 &&
      resultUi.warningBorderWidths.every((width) => width === 0),
    `Warning notice has unwanted border widths: ${resultUi.warningBorderWidths.join(", ")}`,
  );
  for (const [name, padding] of [
    ["contraindication", resultUi.noticePadding],
    ["warning", resultUi.warningPadding],
  ]) {
    assert(padding, `Missing ${name} notice padding measurement`);
    assert(
      padding.blockStart >= 20 &&
        padding.blockEnd >= 20 &&
        padding.inlineStart >= 28 &&
        padding.inlineEnd >= 28,
      `${name} notice padding too tight: ${JSON.stringify(padding)}`,
    );
  }
}

async function assertForcedColorsResultRoute(page, baseUrl) {
  const client = await page.createCDPSession();
  await client.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  await page.goto(`${baseUrl}/info/uti.local.healthy.1`, { waitUntil: "networkidle0" });
  await expectHeading(page, "Cystitis: Gezonde vrouw");

  const forcedColors = await page.evaluate(() => {
    const px = (value) => Number.parseFloat(value || "0");
    const notice = document.querySelector(".contraindication-notice");
    const warning = document.querySelector(".notice--warning");
    const noticeStyle = notice ? getComputedStyle(notice) : null;
    const warningStyle = warning ? getComputedStyle(warning) : null;

    return {
      forcedColorsActive: matchMedia("(forced-colors: active)").matches,
      noticeBorderWidths: noticeStyle
        ? [
            px(noticeStyle.borderTopWidth),
            px(noticeStyle.borderRightWidth),
            px(noticeStyle.borderBottomWidth),
            px(noticeStyle.borderLeftWidth),
          ]
        : [],
      noticeBoxShadow: noticeStyle?.boxShadow ?? "",
      warningBorderWidths: warningStyle
        ? [
            px(warningStyle.borderTopWidth),
            px(warningStyle.borderRightWidth),
            px(warningStyle.borderBottomWidth),
            px(warningStyle.borderLeftWidth),
          ]
        : [],
      warningBoxShadow: warningStyle?.boxShadow ?? "",
    };
  });

  assert(forcedColors.forcedColorsActive, "Forced-colors media emulation did not activate");
  assert(
    forcedColors.noticeBorderWidths.length === 4 &&
      forcedColors.noticeBorderWidths.every((width) => width >= 1),
    `Forced-colors contraindication notice lacks visible border: ${forcedColors.noticeBorderWidths.join(", ")}`,
  );
  assert(
    forcedColors.warningBorderWidths.length === 4 &&
      forcedColors.warningBorderWidths.every((width) => width >= 1),
    `Forced-colors warning notice lacks visible border: ${forcedColors.warningBorderWidths.join(", ")}`,
  );
  assert(
    forcedColors.noticeBoxShadow === "none" && forcedColors.warningBoxShadow === "none",
    `Forced-colors notices should not rely on accent box-shadows: ${JSON.stringify({
      notice: forcedColors.noticeBoxShadow,
      warning: forcedColors.warningBoxShadow,
    })}`,
  );
  await client.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "none" }],
  });
  await client.detach();
}

async function run() {
  assert(chromePath, "Chrome executable not found. Set CHROME_PATH for browser regression smoke.");

  await withPreviewServer(async (baseUrl) => {
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });

    const errors = [];
    const badResponses = [];
    const page = await browser.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) {
        errors.push(message.text());
      }
    });
    page.on("requestfailed", (request) => {
      if (!isIgnoredBrowserRequest(request.url())) {
        badResponses.push(`${request.failure()?.errorText ?? "request failed"} ${request.url()}`);
      }
    });
    page.on("response", (response) => {
      if (response.status() >= 400 && !isIgnoredBrowserRequest(response.url())) {
        badResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    try {
      await assertLandingGrid(page, baseUrl);
      await assertThemeModes(page, baseUrl);
      await assertReducedMotionRouteTransitions(page, baseUrl);
      await assertQuestionnaireNavigation(page, baseUrl);
      await assertQuestionnaireDeepBackStack(page, baseUrl);
      await assertInfoPopoverInteraction(page, baseUrl);
      await assertInfoPopoverViewportFit(page, baseUrl);
      await assertDirectResultRoute(page, baseUrl);
      await assertForcedColorsResultRoute(page, baseUrl);
      assert(badResponses.length === 0, `Browser network errors:\n${badResponses.join("\n")}`);
      assert(errors.length === 0, `Browser console/page errors:\n${errors.join("\n")}`);
      console.log("Browser regression smoke passed");
    } finally {
      await browser.close();
    }
  });
}

run().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exit(1);
});
