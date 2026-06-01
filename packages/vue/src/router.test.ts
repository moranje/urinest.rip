import { describe, expect, it, vi } from "vitest";
import { createBeslismodelDataReadyGuard, type BeslismodelRouteLoadStore } from "./router";
import type { RouteLocationNormalized } from "vue-router";

const to = {
  fullPath: "/questionnaire/strip",
  name: "Questionnaire",
} as unknown as RouteLocationNormalized;
const from = { fullPath: "/", name: "Landing" } as unknown as RouteLocationNormalized;

const runGuard = async (guard: ReturnType<typeof createBeslismodelDataReadyGuard>) =>
  (guard as unknown as (to: RouteLocationNormalized, from: RouteLocationNormalized) => unknown)(
    to,
    from,
  );

const createStore = (
  overrides: Partial<BeslismodelRouteLoadStore> = {},
): BeslismodelRouteLoadStore => ({
  dataReady: false,
  isLoading: false,
  loadingPromise: null,
  loadInitialData: vi.fn(async () => undefined),
  ...overrides,
});

describe("createBeslismodelDataReadyGuard", () => {
  it("allows navigation immediately when data is ready", async () => {
    const store = createStore({ dataReady: true });
    const afterLoad = vi.fn();
    const guard = createBeslismodelDataReadyGuard({
      afterLoad,
      useStore: () => store,
    });

    await expect(runGuard(guard)).resolves.toBe(true);
    expect(store.loadInitialData).not.toHaveBeenCalled();
    expect(afterLoad).not.toHaveBeenCalled();
  });

  it("waits for an existing loading promise", async () => {
    const afterLoad = vi.fn();
    const store = createStore({
      isLoading: true,
      loadingPromise: Promise.resolve().then(() => {
        Object.assign(store, { dataReady: true });
      }),
    });
    const guard = createBeslismodelDataReadyGuard({
      afterLoad,
      useStore: () => store,
    });

    await expect(runGuard(guard)).resolves.toBe(true);
    expect(afterLoad).toHaveBeenCalledOnce();
    expect(store.loadInitialData).not.toHaveBeenCalled();
  });

  it("loads initial data when no load is running", async () => {
    const afterLoad = vi.fn();
    const store = createStore({
      loadInitialData: vi.fn(async () => {
        Object.assign(store, { dataReady: true });
      }),
    });
    const guard = createBeslismodelDataReadyGuard({
      afterLoad,
      useStore: () => store,
    });

    await expect(runGuard(guard)).resolves.toBe(true);
    expect(store.loadInitialData).toHaveBeenCalledOnce();
    expect(afterLoad).toHaveBeenCalledOnce();
  });

  it("routes initial not-ready failures through onFailure", async () => {
    const store = createStore();
    const onFailure = vi.fn(() => ({ name: "Error", query: { retry: "/questionnaire/strip" } }));
    const guard = createBeslismodelDataReadyGuard({
      afterLoad: vi.fn(),
      onFailure,
      useStore: () => store,
    });

    await expect(runGuard(guard)).resolves.toEqual({
      name: "Error",
      query: { retry: "/questionnaire/strip" },
    });
    expect(onFailure).toHaveBeenCalledWith({
      from,
      phase: "initial",
      reason: "not-ready",
      store,
      to,
    });
  });

  it("routes pending load errors through onFailure", async () => {
    const loadError = new Error("load failed");
    const store = createStore({
      isLoading: true,
      loadingPromise: Promise.reject(loadError),
    });
    const onFailure = vi.fn(() => false as const);
    const guard = createBeslismodelDataReadyGuard({
      onFailure,
      useStore: () => store,
    });

    await expect(runGuard(guard)).resolves.toBe(false);
    expect(onFailure).toHaveBeenCalledWith({
      error: loadError,
      from,
      phase: "pending",
      reason: "load-error",
      store,
      to,
    });
  });

  it("returns false for failures without an onFailure handler", async () => {
    const store = createStore();
    const guard = createBeslismodelDataReadyGuard({
      useStore: () => store,
    });

    await expect(runGuard(guard)).resolves.toBe(false);
  });
});
