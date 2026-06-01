export interface MarkdownRenderer {
  render(markdown: string | undefined): string;
}

export interface MarkdownRendererOptions {
  parse: (markdown: string) => string;
  sanitize: (html: string) => string;
}

export function createMarkdownRenderer(options: MarkdownRendererOptions): MarkdownRenderer {
  return {
    render(markdown: string | undefined): string {
      if (!markdown) return "";
      return options.sanitize(options.parse(markdown));
    },
  };
}
