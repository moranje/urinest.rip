import { nextTick } from "vue";
import type { NavigationGuard, RouteLocationNormalized, RouteLocationRaw } from "vue-router";

export interface BeslismodelRouteLoadStore {
  readonly dataReady: boolean;
  readonly isLoading: boolean;
  readonly loadingPromise: Promise<void> | null;
  loadInitialData(): Promise<void>;
}

export type BeslismodelDataReadyGuardFailure =
  | {
      readonly reason: "load-error";
      readonly phase: "pending" | "initial";
      readonly error: unknown;
      readonly to: RouteLocationNormalized;
      readonly from: RouteLocationNormalized;
      readonly store: BeslismodelRouteLoadStore;
    }
  | {
      readonly reason: "not-ready";
      readonly phase: "pending" | "initial";
      readonly to: RouteLocationNormalized;
      readonly from: RouteLocationNormalized;
      readonly store: BeslismodelRouteLoadStore;
    };

export interface CreateBeslismodelDataReadyGuardOptions {
  readonly useStore: () => BeslismodelRouteLoadStore;
  readonly afterLoad?: () => void | Promise<void>;
  readonly onFailure?: (
    failure: BeslismodelDataReadyGuardFailure,
  ) => RouteLocationRaw | false | void | Promise<RouteLocationRaw | false | void>;
}

const defaultAfterLoad = async (): Promise<void> => {
  await nextTick();
};

export function createBeslismodelDataReadyGuard(
  options: CreateBeslismodelDataReadyGuardOptions,
): NavigationGuard {
  const afterLoad = options.afterLoad ?? defaultAfterLoad;

  const handleFailure = async (
    failure: BeslismodelDataReadyGuardFailure,
  ): Promise<RouteLocationRaw | false> => (await options.onFailure?.(failure)) ?? false;

  return async (to, from) => {
    const store = options.useStore();

    if (store.dataReady) {
      return true;
    }

    if (store.loadingPromise) {
      try {
        await store.loadingPromise;
        await afterLoad();
      } catch (error) {
        return handleFailure({
          error,
          from,
          phase: "pending",
          reason: "load-error",
          store,
          to,
        });
      }

      if (store.dataReady) {
        return true;
      }

      return handleFailure({
        from,
        phase: "pending",
        reason: "not-ready",
        store,
        to,
      });
    }

    if (!store.isLoading && !store.dataReady) {
      try {
        await store.loadInitialData();
        await afterLoad();
      } catch (error) {
        return handleFailure({
          error,
          from,
          phase: "initial",
          reason: "load-error",
          store,
          to,
        });
      }

      if (store.dataReady) {
        return true;
      }

      return handleFailure({
        from,
        phase: "initial",
        reason: "not-ready",
        store,
        to,
      });
    }

    return true;
  };
}
