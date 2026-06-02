export type BreadcrumbType = "navigation" | "click" | "api" | "log" | "flow";

export interface Breadcrumb {
  readonly type: BreadcrumbType;
  readonly message: string;
  readonly timestamp: string;
  readonly count?: number;
  readonly data?: Readonly<Record<string, unknown>>;
}

export type BreadcrumbInput = Omit<Breadcrumb, "timestamp" | "count">;

export interface CreateBreadcrumbOptions {
  readonly timestamp: string;
  readonly count?: number;
}

export interface AppendBreadcrumbOptions {
  readonly maxLength?: number;
  readonly now?: () => string;
}

export function createBreadcrumb(
  input: BreadcrumbInput,
  options: CreateBreadcrumbOptions,
): Breadcrumb {
  if (!input.message.trim()) {
    throw new Error("Breadcrumb message must not be empty");
  }
  if (!options.timestamp.trim()) {
    throw new Error("Breadcrumb timestamp must not be empty");
  }
  if (options.count !== undefined && (!Number.isInteger(options.count) || options.count < 1)) {
    throw new Error(`Breadcrumb count must be a positive integer: ${options.count}`);
  }

  return Object.freeze({
    ...input,
    data: input.data ? Object.freeze({ ...input.data }) : undefined,
    timestamp: options.timestamp,
    count: options.count,
  });
}

export function appendBreadcrumb(
  breadcrumbs: readonly Breadcrumb[],
  input: BreadcrumbInput,
  options: AppendBreadcrumbOptions = {},
): readonly Breadcrumb[] {
  const maxLength = options.maxLength ?? 25;
  if (!Number.isInteger(maxLength) || maxLength < 1) {
    throw new Error(`Breadcrumb maxLength must be a positive integer: ${maxLength}`);
  }

  const timestamp = options.now?.() ?? new Date().toISOString();
  const last = breadcrumbs[breadcrumbs.length - 1];
  if (last && last.type === input.type && last.message === input.message) {
    const updated = createBreadcrumb(
      {
        type: last.type,
        message: last.message,
        data: input.data ?? last.data,
      },
      { timestamp, count: (last.count ?? 1) + 1 },
    );
    return Object.freeze([...breadcrumbs.slice(0, -1), updated].slice(-maxLength));
  }

  return Object.freeze([...breadcrumbs, createBreadcrumb(input, { timestamp })].slice(-maxLength));
}

export function cloneBreadcrumbs(breadcrumbs: readonly Breadcrumb[]): Breadcrumb[] {
  return breadcrumbs.map((breadcrumb) => ({
    ...breadcrumb,
    data: breadcrumb.data ? { ...breadcrumb.data } : undefined,
  }));
}
