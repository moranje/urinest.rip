export type CalculatorId = string;

export interface CalculatorExecutionContext {
  readonly role?: string;
  readonly locale?: string;
  readonly now?: Date;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CalculatorDefinition<Input = unknown, Output = unknown> {
  readonly id: CalculatorId;
  readonly version?: string;
  readonly label?: string;
  readonly validateInput?: (input: unknown) => input is Input;
  calculate(input: Input, context: CalculatorExecutionContext): Output | Promise<Output>;
}

export interface CalculatorRegistry {
  list(): readonly CalculatorDefinition[];
  has(id: CalculatorId): boolean;
  get(id: CalculatorId): CalculatorDefinition;
  run<Output = unknown>(
    id: CalculatorId,
    input: unknown,
    context?: CalculatorExecutionContext,
  ): Promise<Output>;
}

const defaultContext: CalculatorExecutionContext = {};

const assertValidCalculatorId = (id: CalculatorId): void => {
  if (!id.trim()) {
    throw new Error("Calculator id must not be empty");
  }
};

export function createCalculatorRegistry(
  calculators: readonly CalculatorDefinition[] = [],
): CalculatorRegistry {
  const byId = new Map<CalculatorId, CalculatorDefinition>();

  for (const calculator of calculators) {
    assertValidCalculatorId(calculator.id);
    if (byId.has(calculator.id)) {
      throw new Error(`Duplicate calculator id: ${calculator.id}`);
    }
    byId.set(calculator.id, calculator);
  }

  return {
    list(): readonly CalculatorDefinition[] {
      return Object.freeze([...byId.values()]);
    },

    has(id: CalculatorId): boolean {
      return byId.has(id);
    },

    get(id: CalculatorId): CalculatorDefinition {
      const calculator = byId.get(id);
      if (!calculator) {
        throw new Error(`Unknown calculator id: ${id}`);
      }
      return calculator;
    },

    async run<Output = unknown>(
      id: CalculatorId,
      input: unknown,
      context: CalculatorExecutionContext = defaultContext,
    ): Promise<Output> {
      const calculator = this.get(id);
      if (calculator.validateInput && !calculator.validateInput(input)) {
        throw new Error(`Invalid input for calculator id: ${id}`);
      }
      return (await calculator.calculate(input, context)) as Output;
    },
  };
}
