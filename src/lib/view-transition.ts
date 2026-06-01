export function isSkippedViewTransition(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : String(error);
  const name = error instanceof DOMException || error instanceof Error ? error.name : "";

  return (
    message.includes("Transition was skipped") ||
    message.includes("View transition was skipped") ||
    ((name === "AbortError" || name === "InvalidStateError") &&
      message.toLowerCase().includes("transition"))
  );
}

interface PromiseLikeWithCatch {
  catch(onRejected: (error: unknown) => void): unknown;
}

interface ViewTransitionLike {
  finished?: PromiseLikeWithCatch;
  ready?: PromiseLikeWithCatch;
  updateCallbackDone?: PromiseLikeWithCatch;
}

const isPromiseLikeWithCatch = (value: unknown): value is PromiseLikeWithCatch =>
  typeof value === "object" &&
  value !== null &&
  "catch" in value &&
  typeof (value as { catch?: unknown }).catch === "function";

export function observeViewTransition(
  transition: unknown,
  onUnexpectedError?: (error: unknown) => void,
): void {
  if (typeof transition !== "object" || transition === null) return;

  const viewTransition = transition as ViewTransitionLike;
  for (const promise of [
    viewTransition.finished,
    viewTransition.ready,
    viewTransition.updateCallbackDone,
  ]) {
    if (!isPromiseLikeWithCatch(promise)) continue;
    promise.catch((error: unknown) => {
      if (isSkippedViewTransition(error)) return;
      onUnexpectedError?.(error);
    });
  }
}
