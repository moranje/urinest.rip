import DOMPurify from "dompurify";
import { marked } from "marked";
import { createMarkdownRenderer } from "@moranje/beslismodel/core";

export const markdownRenderer = createMarkdownRenderer({
  parse: (markdown) => marked.parse(markdown) as string,
  sanitize: (html) => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }),
});

export const renderMarkdown = (markdown: string | undefined): string =>
  markdownRenderer.render(markdown);
