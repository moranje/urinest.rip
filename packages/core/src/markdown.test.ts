import { describe, expect, it, vi } from "vitest";
import { createMarkdownRenderer } from "./markdown";

describe("createMarkdownRenderer", () => {
  it("requires parse and sanitize steps for markdown output", () => {
    const parse = vi.fn((markdown: string) => `<p>${markdown}</p>`);
    const sanitize = vi.fn((html: string) => html.replace("<script>", ""));
    const renderer = createMarkdownRenderer({ parse, sanitize });

    expect(renderer.render("tekst")).toBe("<p>tekst</p>");
    expect(parse).toHaveBeenCalledWith("tekst");
    expect(sanitize).toHaveBeenCalledWith("<p>tekst</p>");
  });

  it("returns an empty string for missing markdown", () => {
    const renderer = createMarkdownRenderer({
      parse: (markdown) => markdown,
      sanitize: (html) => html,
    });

    expect(renderer.render(undefined)).toBe("");
  });
});
