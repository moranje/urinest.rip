import { describe, expect, it } from "vitest";
import router from "./index";

describe("app router", () => {
  it("guards clinical routes until beslismodel data is ready", () => {
    const questionnaireRoute = router.getRoutes().find((route) => route.name === "Questionnaire");
    const resultRoute = router.getRoutes().find((route) => route.name === "Result");

    expect(questionnaireRoute?.beforeEnter).toBeDefined();
    expect(resultRoute?.beforeEnter).toBeDefined();
  });
});
