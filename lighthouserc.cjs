const { existsSync } = require("node:fs");

const chromeCandidates = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
];

const chromePath =
  process.env.CHROME_PATH || chromeCandidates.find((candidate) => existsSync(candidate));

module.exports = {
  ci: {
    collect: {
      chromePath,
      numberOfRuns: 1,
      startServerCommand: "npm run preview -- --host 127.0.0.1 --port 4173",
      startServerReadyPattern: "Local:.*http://127.0.0.1:4173/",
      startServerReadyTimeout: 30000,
      url: [
        "http://127.0.0.1:4173/",
        "http://127.0.0.1:4173/questionnaire/strip",
        "http://127.0.0.1:4173/info/other.noConclusiveAbnormality",
      ],
      settings: {
        chromeFlags: "--headless=new --no-sandbox --disable-dev-shm-usage",
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        // WCAG 2.2 AA is enforced by axe route tests; Lighthouse remains the hosted-browser smoke.
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:performance": ["warn", { minScore: 0.85 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 3500 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
      },
    },
    upload: {
      outputDir: "./docs/lighthouse",
      target: "filesystem",
    },
  },
};
