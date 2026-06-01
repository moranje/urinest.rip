import { beforeEach, describe, expect, it } from "vitest";
import { appConfig } from "../../config/app-config";
import {
  appendStoredRedirectTrail,
  clearStoredRedirectTrail,
  readStoredRedirectTrail,
} from "../redirect-trail";
import { readStorage, writeStorage } from "../storage";

describe("redirect trail storage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("normalizes missing, stale and invalid trails", () => {
    expect(readStoredRedirectTrail("strip", 100)).toEqual({ flows: ["strip"], updatedAt: 100 });

    writeStorage(
      "session",
      appConfig.storage.redirectChainKey,
      JSON.stringify({ flows: ["strip", "bacteriurie"], updatedAt: 1 }),
    );
    expect(
      readStoredRedirectTrail("bacteriurie", appConfig.storage.redirectChainTtlMs + 2),
    ).toEqual({
      flows: ["bacteriurie"],
      updatedAt: appConfig.storage.redirectChainTtlMs + 2,
    });

    writeStorage("session", appConfig.storage.redirectChainKey, JSON.stringify({ flows: [1] }));
    expect(readStoredRedirectTrail("strip", 200)).toEqual({ flows: ["strip"], updatedAt: 200 });
  });

  it("appends non-cyclic redirects and persists them", () => {
    expect(appendStoredRedirectTrail("strip", "bacteriurie", 10)).toEqual({
      type: "ok",
      trail: { flows: ["strip", "bacteriurie"], updatedAt: 10 },
    });
    expect(readStorage("session", appConfig.storage.redirectChainKey)).toBe(
      JSON.stringify({ flows: ["strip", "bacteriurie"], updatedAt: 10 }),
    );
  });

  it("reports cycles without persisting the cyclic trail", () => {
    appendStoredRedirectTrail("strip", "bacteriurie", 10);

    expect(appendStoredRedirectTrail("bacteriurie", "strip", 20)).toEqual({
      type: "cycle",
      trail: { flows: ["strip", "bacteriurie", "strip"], updatedAt: 20 },
      cycle: ["strip", "bacteriurie", "strip"],
    });
    expect(readStoredRedirectTrail("bacteriurie", 20)).toEqual({
      flows: ["strip", "bacteriurie"],
      updatedAt: 10,
    });

    clearStoredRedirectTrail();
    expect(readStorage("session", appConfig.storage.redirectChainKey)).toBeNull();
  });
});
