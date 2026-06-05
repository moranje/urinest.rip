import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import process from "node:process";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

const require = createRequire(import.meta.url);
const lighthouseConfig = require("../lighthouserc.cjs");

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

function routePath(url) {
  return new URL(url).pathname;
}

function reportName(url, extension) {
  const parsed = new URL(url);
  const path = parsed.pathname === "/" ? "index" : parsed.pathname.split("/").filter(Boolean).join("-");
  return `${path || basename(parsed.pathname)}.${extension}`;
}

function assertionValue(lhr, id) {
  if (id.startsWith("categories:")) {
    return lhr.categories[id.slice("categories:".length)]?.score ?? null;
  }
  return lhr.audits[id]?.numericValue ?? null;
}

function evaluateAssertion(lhr, id, [level, options]) {
  const value = assertionValue(lhr, id);
  const failures = [];
  const warnings = [];

  if (value === null) {
    failures.push(`${id}: audit not found`);
    return { failures, warnings };
  }

  const messages = level === "warn" ? warnings : failures;
  if (typeof options?.minScore === "number" && value < options.minScore) {
    messages.push(`${id}: expected >= ${options.minScore}, received ${value}`);
  }
  if (typeof options?.maxNumericValue === "number" && value > options.maxNumericValue) {
    messages.push(`${id}: expected <= ${options.maxNumericValue}, received ${value}`);
  }
  return { failures, warnings };
}

async function runLighthouseForUrl(chrome, url, outputDir) {
  const result = await lighthouse(
    url,
    {
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
      logLevel: "error",
      output: ["html", "json"],
      port: chrome.port,
      preset: "desktop",
    },
    undefined,
  );
  assert(result?.lhr, `Lighthouse returned no result for ${url}`);

  const [htmlReport, jsonReport] = Array.isArray(result.report)
    ? result.report
    : [result.report, JSON.stringify(result.lhr)];
  writeFileSync(join(outputDir, reportName(url, "html")), htmlReport);
  writeFileSync(join(outputDir, reportName(url, "json")), jsonReport);

  const assertions = lighthouseConfig.ci.assert.assertions;
  const failures = [];
  const warnings = [];
  for (const [id, assertion] of Object.entries(assertions)) {
    const outcome = evaluateAssertion(result.lhr, id, assertion);
    failures.push(...outcome.failures.map((message) => `${url} ${message}`));
    warnings.push(...outcome.warnings.map((message) => `${url} ${message}`));
  }
  for (const warning of warnings) console.warn(`Lighthouse warning: ${warning}`);
  return failures;
}

async function run() {
  assert(chromePath, "Chrome executable not found. Set CHROME_PATH for Lighthouse.");

  await withPreviewServer(async (baseUrl) => {
    const outputDir = lighthouseConfig.ci.upload.outputDir;
    mkdirSync(outputDir, { recursive: true });

    const chrome = await launch({
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
      chromePath,
    });
    try {
      const configuredUrls = lighthouseConfig.ci.collect.url;
      const urls = configuredUrls.map((url) => `${baseUrl}${routePath(url)}`);
      const failures = [];
      for (const url of urls) {
        failures.push(...(await runLighthouseForUrl(chrome, url, outputDir)));
      }
      assert(failures.length === 0, `Lighthouse assertions failed:\n${failures.join("\n")}`);
      console.log("Lighthouse checks passed");
    } finally {
      await chrome.kill();
    }
  });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
