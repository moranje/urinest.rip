import { describe, expect, it, vi } from "vitest";
import { readStorage, removeStorage, writeStorage } from "../storage";

function installStorage(name: "localStorage" | "sessionStorage") {
  const values = new Map<string, string>();
  const storage = {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  };
  Object.defineProperty(window, name, { value: storage, configurable: true });
  vi.stubGlobal(name, storage);
  return storage;
}

describe("storage helpers", () => {
  it("reads, writes and removes browser storage values", () => {
    installStorage("localStorage");
    expect(writeStorage("local", "storage-test", "ok")).toBe(true);
    expect(readStorage("local", "storage-test")).toBe("ok");
    expect(removeStorage("local", "storage-test")).toBe(true);
    expect(readStorage("local", "storage-test")).toBeNull();
  });

  it("returns safe fallbacks when storage throws", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      key: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      setItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      length: 0,
    };
    Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
    vi.stubGlobal("localStorage", storage);

    expect(readStorage("local", "blocked")).toBeNull();
    expect(writeStorage("local", "blocked", "value")).toBe(false);
    expect(removeStorage("local", "blocked")).toBe(false);
  });
});
