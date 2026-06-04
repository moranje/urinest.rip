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
    server.kill("SIGTERM");
  }
}

async function expectHeading(page, text) {
  await page.waitForFunction(
    (expected) => document.querySelector("h1")?.textContent?.includes(expected),
    { timeout: 10_000 },
    text,
  );
}

async function assertLandingGrid(page, baseUrl) {
  await page.setViewport({ width: 1714, height: 1200, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
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

async function assertQuestionnaireNavigation(page, baseUrl) {
  await page.goto(`${baseUrl}/questionnaire/strip`, { waitUntil: "networkidle0" });
  await expectHeading(page, "Nitriet test");

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
  await page.waitForFunction(
    () =>
      location.pathname === "/questionnaire/bacteriurie" &&
      location.search.includes("q=q_bac_tissue") &&
      document.querySelector("h1")?.textContent?.includes("Is er sprake van weefselinvasie?"),
    { timeout: 10_000 },
  );

  await page.goBack({ waitUntil: "networkidle0" });
  await page.waitForFunction(
    () =>
      location.pathname === "/questionnaire/strip" &&
      location.search.includes("q=q_strip_nitrite") &&
      document.querySelector("h1")?.textContent?.includes("Nitriet test"),
    { timeout: 10_000 },
  );
}

async function assertDirectResultRoute(page, baseUrl) {
  await page.goto(`${baseUrl}/info/uti.local.healthy.1`, { waitUntil: "networkidle0" });
  await expectHeading(page, "Cystitis: Gezonde vrouw");

  const text = await page.evaluate(() => document.body.textContent ?? "");
  assert(!text.includes("Resultaat bepalen"), "Direct result route stayed stuck on loader");
  assert(!text.includes("Vragenlijst laden"), "Direct result route stayed stuck on shell loader");
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
      if (
        message.type() === "error" &&
        !message.text().includes("Failed to load resource: the server responded with a status of")
      ) {
        errors.push(message.text());
      }
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        badResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    try {
      await assertLandingGrid(page, baseUrl);
      await assertQuestionnaireNavigation(page, baseUrl);
      await assertDirectResultRoute(page, baseUrl);
      assert(badResponses.length === 0, `Browser network errors:\n${badResponses.join("\n")}`);
      assert(errors.length === 0, `Browser console/page errors:\n${errors.join("\n")}`);
      console.log("Browser regression smoke passed");
    } finally {
      await browser.close();
    }
  });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
