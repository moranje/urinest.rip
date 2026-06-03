import type { CalculatorExecutionContext, CalculatorRegistry } from "./calculator";
import type { ConditionAnswers } from "./conditions";
import type {
  ManifestCalculatorBinding,
  ManifestCalculatorInputBinding,
  ManifestCalculatorInputCoercion,
  ManifestCalculatorOutputBinding,
  ManifestId,
  ManifestResultLogicRule,
} from "./manifest";
import { validateConditions } from "./conditions";
import { determineOutcome, type OutcomeResolution } from "./outcome";

export interface CalculatorBindingAnswer {
  readonly value: unknown;
  readonly text: string;
  readonly metadata: Readonly<{
    readonly calculationId: ManifestId;
    readonly calculatorId: ManifestId;
    readonly sourcePath?: string;
  }>;
}

export interface CalculatorBindingExecution {
  readonly calculationId: ManifestId;
  readonly calculatorId: ManifestId;
  readonly input: Readonly<Record<string, unknown>>;
  readonly result: unknown;
  readonly outputAnswers: Readonly<Record<ManifestId, CalculatorBindingAnswer>>;
}

export interface RunCalculatorBindingsInput {
  readonly answers?: ConditionAnswers;
  readonly bindings?: readonly ManifestCalculatorBinding[] | null;
  readonly registry: CalculatorRegistry;
  readonly context?: CalculatorExecutionContext;
}

export interface RunCalculatorBindingsResult {
  readonly answers: ConditionAnswers;
  readonly calculations: readonly CalculatorBindingExecution[];
}

export interface DetermineOutcomeWithCalculatorsInput {
  readonly answers?: ConditionAnswers;
  readonly resultsLogic?: readonly ManifestResultLogicRule[] | null;
  readonly calculatorBindings?: readonly ManifestCalculatorBinding[] | null;
  readonly registry: CalculatorRegistry;
  readonly context?: CalculatorExecutionContext;
}

export interface CalculatedOutcomeResolution extends OutcomeResolution {
  readonly answers: ConditionAnswers;
  readonly calculations: readonly CalculatorBindingExecution[];
}

export class CalculatorBindingError extends Error {
  constructor(
    message: string,
    readonly calculationId: ManifestId,
    readonly field?: string,
  ) {
    super(message);
    this.name = "CalculatorBindingError";
  }
}

const hasValue = (value: unknown): boolean => value !== undefined && value !== null;

const unwrapAnswerValue = (value: unknown): unknown => {
  if (typeof value === "object" && value !== null && "value" in value) {
    return (value as { value?: unknown }).value;
  }
  return value;
};

const getPathValue = (source: unknown, path?: string): unknown => {
  if (!path) return source;
  return path.split(".").reduce<unknown>((current, segment) => {
    if (typeof current !== "object" || current === null) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, source);
};

const coerceValue = (
  value: unknown,
  coercion: ManifestCalculatorInputCoercion | undefined,
  calculationId: ManifestId,
  field: string,
): unknown => {
  if (!coercion) return value;

  if (coercion === "string") return String(value);
  if (coercion === "boolean") {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    throw new CalculatorBindingError(
      `Calculation "${calculationId}" input "${field}" cannot be coerced to boolean.`,
      calculationId,
      field,
    );
  }

  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new CalculatorBindingError(
      `Calculation "${calculationId}" input "${field}" cannot be coerced to number.`,
      calculationId,
      field,
    );
  }
  return numberValue;
};

const resolveInputValue = (
  answers: ConditionAnswers,
  context: CalculatorExecutionContext,
  binding: ManifestCalculatorInputBinding,
  calculationId: ManifestId,
  field: string,
): unknown => {
  let value: unknown;
  if (binding.source === "literal") {
    value = binding.value;
  } else if (binding.source === "context") {
    value = getPathValue(context, binding.key);
    if (!hasValue(value)) {
      value = getPathValue(context.metadata, binding.key);
    }
  } else {
    value = unwrapAnswerValue(binding.key ? answers[binding.key] : undefined);
  }

  value = getPathValue(value, binding.path);

  if (!hasValue(value)) {
    if (binding.required !== false) {
      throw new CalculatorBindingError(
        `Calculation "${calculationId}" missing required input "${field}".`,
        calculationId,
        field,
      );
    }
    return undefined;
  }

  return coerceValue(value, binding.coerce, calculationId, field);
};

const formatAnswerText = (value: unknown, output: ManifestCalculatorOutputBinding): string => {
  if (output.text) return output.text;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value) ?? "";
};

const toVirtualAnswer = (
  value: unknown,
  calculation: ManifestCalculatorBinding,
  output: ManifestCalculatorOutputBinding,
): CalculatorBindingAnswer => ({
  value,
  text: formatAnswerText(value, output),
  metadata: {
    calculationId: calculation.id,
    calculatorId: calculation.calculatorId,
    sourcePath: output.path,
  },
});

export async function runCalculatorBindings(
  input: RunCalculatorBindingsInput,
): Promise<RunCalculatorBindingsResult> {
  const baseAnswers = input.answers ?? {};
  const bindings = input.bindings ?? [];
  const context = input.context ?? {};
  const answers: Record<string, unknown> = { ...baseAnswers };
  const calculations: CalculatorBindingExecution[] = [];

  for (const binding of bindings) {
    if (!validateConditions(answers, binding.conditions).isValid) continue;

    const calculatorInput: Record<string, unknown> = {};
    for (const [field, inputBinding] of Object.entries(binding.input)) {
      const value = resolveInputValue(answers, context, inputBinding, binding.id, field);
      if (hasValue(value)) calculatorInput[field] = value;
    }

    const result = await input.registry.run(binding.calculatorId, calculatorInput, context);
    const outputAnswers: Record<ManifestId, CalculatorBindingAnswer> = {};

    for (const [answerId, outputBinding] of Object.entries(binding.outputs)) {
      const value = getPathValue(result, outputBinding.path);
      outputAnswers[answerId] = toVirtualAnswer(value, binding, outputBinding);
      answers[answerId] = outputAnswers[answerId];
    }

    calculations.push({
      calculationId: binding.id,
      calculatorId: binding.calculatorId,
      input: Object.freeze({ ...calculatorInput }),
      result,
      outputAnswers: Object.freeze(outputAnswers),
    });
  }

  return {
    answers: Object.freeze(answers),
    calculations: Object.freeze(calculations),
  };
}

export async function determineOutcomeWithCalculators(
  input: DetermineOutcomeWithCalculatorsInput,
): Promise<CalculatedOutcomeResolution> {
  const resolved = await runCalculatorBindings({
    answers: input.answers,
    bindings: input.calculatorBindings,
    registry: input.registry,
    context: input.context,
  });
  const outcome = determineOutcome(resolved.answers, input.resultsLogic);

  return {
    ...outcome,
    answers: resolved.answers,
    calculations: resolved.calculations,
  };
}
