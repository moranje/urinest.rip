import { describe, expect, it } from "vitest";
import { useQuestionNavigation } from "./useQuestionNavigation";

describe("useQuestionNavigation", () => {
  it("tracks current question and backward history", () => {
    const nav = useQuestionNavigation();
    nav.setCurrentQuestion("q1");
    nav.pushHistory("q1");
    nav.setCurrentQuestion("q2");

    expect(nav.hasHistory.value).toBe(true);
    expect(nav.goBack()).toBe("q1");
    expect(nav.hasHistory.value).toBe(false);
  });

  it("can reset and replace history", () => {
    const nav = useQuestionNavigation();
    nav.replaceHistory(["q1", "q2"]);
    nav.resetNavigation("q3");

    expect(nav.currentQuestionId.value).toBe("q3");
    expect(nav.questionHistory.value).toEqual([]);
  });
});
