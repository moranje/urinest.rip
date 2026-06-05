import { describe, expect, it } from "vitest";
import { isValidBsn, scrubText, scrubValue } from "../scrub";

describe("scrubText", () => {
  it("scrubs valid BSN values", () => {
    expect(isValidBsn("111222333")).toBe(true);
    expect(scrubText("patient 111222333")).toBe("patient ***SCRUBBED-BSN***");
  });

  it("leaves invalid 9-digit values intact", () => {
    expect(isValidBsn("123456789")).toBe(false);
    expect(scrubText("reference 123456789")).toBe("reference 123456789");
  });

  it("does not scrub postcode-like values", () => {
    expect(scrubText("postcode 1234AB")).toBe("postcode 1234AB");
  });

  it("does not scrub phone-like values without BSN 11-proef", () => {
    expect(scrubText("bel 0612345678")).toBe("bel 0612345678");
  });

  it("scrubs email addresses", () => {
    expect(scrubText("mail test.patient@example.org")).toBe("mail ***SCRUBBED-EMAIL***");
  });

  it("scrubs JWT values", () => {
    const header = ["ey", "JhbGciOiJIUzI1NiJ9"].join("");
    const payload = ["ey", "JzdWIiOiIxIn0"].join("");

    expect(scrubText(`jwt ${header}.${payload}.signature`)).toBe("jwt ***SCRUBBED-JWT***");
  });

  it("scrubs Supabase token query parameters", () => {
    const url = "https://project.supabase.co/rest/v1/app_logs?apikey=abc123&select=*";
    expect(scrubText(url)).toBe(
      "https://project.supabase.co/rest/v1/app_logs?apikey=***SCRUBBED-TOKEN***&select=*",
    );
  });

  it("scrubs mixed nested object leaves and reports hit count", () => {
    const result = scrubValue({
      stack: "patient 111222333 op 01-06-2026",
      nested: { email: "arts@example.test" },
    });

    expect(JSON.stringify(result.value)).not.toContain("111222333");
    expect(JSON.stringify(result.value)).not.toContain("arts@example.test");
    expect(result.stats.hits).toBe(3);
  });
});
