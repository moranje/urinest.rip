export interface RuntimeContextValues {
  readonly [key: string]: unknown;
}

export interface RuntimeContext {
  readonly values: RuntimeContextValues;
  has(key: string): boolean;
  get<T = unknown>(key: string): T | undefined;
}

export interface ApplyRuntimeContextOptions {
  readonly aliases?: Readonly<Record<string, string>>;
  readonly includeContextKeys?: boolean;
}

const isRuntimeContext = (
  context: RuntimeContext | RuntimeContextValues,
): context is RuntimeContext =>
  typeof context === "object" &&
  context !== null &&
  "values" in context &&
  typeof (context as RuntimeContext).has === "function" &&
  typeof (context as RuntimeContext).get === "function";

export function createRuntimeContext(values: RuntimeContextValues = {}): RuntimeContext {
  const frozenValues = Object.freeze({ ...values });

  return Object.freeze({
    values: frozenValues,

    has(key: string): boolean {
      return Object.prototype.hasOwnProperty.call(frozenValues, key);
    },

    get<T = unknown>(key: string): T | undefined {
      return frozenValues[key] as T | undefined;
    },
  });
}

export function extendRuntimeContext(
  context: RuntimeContext | RuntimeContextValues,
  values: RuntimeContextValues,
): RuntimeContext {
  const base = isRuntimeContext(context) ? context.values : context;
  return createRuntimeContext({ ...base, ...values });
}

export function applyRuntimeContext(
  input: Readonly<Record<string, unknown>>,
  context: RuntimeContext | RuntimeContextValues,
  options: ApplyRuntimeContextOptions = {},
): Record<string, unknown> {
  const values = isRuntimeContext(context) ? context.values : context;
  const includeContextKeys = options.includeContextKeys ?? true;
  const output: Record<string, unknown> = { ...input };

  if (includeContextKeys) {
    Object.assign(output, values);
  }

  for (const [sourceKey, targetKey] of Object.entries(options.aliases ?? {})) {
    if (Object.prototype.hasOwnProperty.call(values, sourceKey)) {
      output[targetKey] = values[sourceKey];
    }
  }

  return output;
}
