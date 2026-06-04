/* eslint-disable security/detect-non-literal-fs-filename */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("security headers", () => {
  it("serves a strict CSP and browser hardening headers", () => {
    const headers = read("public/_headers");

    expect(headers).toContain("Strict-Transport-Security:");
    expect(headers).toContain("Permissions-Policy:");
    expect(headers).toContain("Content-Security-Policy:");
    expect(headers).toContain("script-src 'self' https://stats.oranje.wtf");
    expect(headers).toContain("style-src 'self' https://fonts.googleapis.com");
    expect(headers).toContain("style-src-attr 'unsafe-inline'");
    expect(headers).toContain("font-src 'self' https://fonts.gstatic.com");
    expect(headers).toContain("connect-src 'self' https://stats.oranje.wtf");
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).not.toContain("script-src 'self' https://stats.oranje.wtf 'unsafe-inline'");
    expect(headers).not.toContain("'unsafe-eval'");
  });

  it("keeps index free of inline scripts and inline event handlers", () => {
    const index = read("index.html");
    const themeInit = read("public/theme-init.js");

    expect(index).toContain('src="/theme-init.js"');
    expect(index).not.toMatch(/<script>\s*\(function/);
    expect(index).not.toContain("onload=");
    expect(themeInit).toContain("localStorage.getItem");
    expect(themeInit).toContain("data-theme");
    expect(themeInit).toContain("theme-color");
    expect(themeInit).toContain("#16a34a");
    expect(themeInit).toContain("#005a2b");
  });
});
