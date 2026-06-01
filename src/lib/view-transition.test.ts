import { describe, expect, it, vi } from "vitest";
import { isSkippedViewTransition, observeViewTransition } from "./view-transition";

describe("view-transition helpers", () => {
  it("classifies skipped transitions as benign", () => {
    expect(isSkippedViewTransition(new Error("Transition was skipped"))).toBe(true);
    expect(isSkippedViewTransition(new Error("real render failure"))).toBe(false);
  });

  it("swallows skipped transition promise rejections", async () => {
    const onUnexpectedError = vi.fn();
    observeViewTransition(
      { finished: Promise.reject(new Error("Transition was skipped")) },
      onUnexpectedError,
    );

    await Promise.resolve();
    expect(onUnexpectedError).not.toHaveBeenCalled();
  });

  it("reports unexpected transition promise rejections", async () => {
    const onUnexpectedError = vi.fn();
    const error = new Error("snapshot failed");
    observeViewTransition({ finished: Promise.reject(error) }, onUnexpectedError);

    await Promise.resolve();
    expect(onUnexpectedError).toHaveBeenCalledWith(error);
  });
});
