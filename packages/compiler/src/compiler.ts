/* eslint-disable security/detect-non-literal-fs-filename */
import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { glob } from "glob";
import yaml from "js-yaml";
import pc from "picocolors";
import { flowSchema } from "./schema";

export interface FlowCompilerLogger {
  info(message: string): void;
  success(message: string): void;
}

export interface BuildFlowsOptions {
  readonly logger?: FlowCompilerLogger;
}

interface RawOption {
  readonly id?: string;
  readonly text?: string;
  readonly value?: unknown;
  readonly [key: string]: unknown;
}

interface RawQuestion {
  readonly id?: string;
  readonly options?: readonly RawOption[];
  readonly conditions?: readonly { readonly if: string }[];
  readonly [key: string]: unknown;
}

interface RawStep {
  readonly id?: string;
  readonly title?: string;
  readonly description?: string;
  readonly questions?: readonly string[];
}

interface RawResult {
  readonly contraindications?: readonly (string | { readonly text?: string })[];
  readonly sources?: readonly {
    readonly name?: string;
    readonly label?: string;
    readonly url?: string;
  }[];
  readonly [key: string]: unknown;
}

interface RawLogicRule {
  readonly id?: string;
  readonly when?: readonly string[];
  readonly show?: string;
  readonly redirect?: string;
}

interface RawFlow {
  readonly id: string;
  readonly version?: string;
  readonly name?: string;
  readonly title: string;
  readonly description?: string;
  readonly hiddenFromLandingPage?: boolean;
  readonly questions: Record<string, RawQuestion>;
  readonly steps: readonly RawStep[];
  readonly results: Record<string, RawResult>;
  readonly logic: readonly RawLogicRule[];
}

interface CompiledCondition {
  readonly questionId: string;
  readonly operator: string;
  readonly value: unknown;
}

interface CompiledQuestion extends Omit<RawQuestion, "conditions" | "id" | "options"> {
  readonly id: string;
  readonly options: readonly (RawOption & { readonly id: string })[];
  readonly conditions: readonly CompiledCondition[];
}

interface CompiledStep {
  readonly id: string;
  readonly title?: string;
  readonly description?: string;
  readonly questionIds: readonly string[];
}

interface CompiledResult extends Omit<RawResult, "contraindications"> {
  readonly contraindications: readonly {
    readonly id: string;
    readonly text: string;
    readonly checked: false;
  }[];
}

interface CompiledLogicRule {
  readonly id: string;
  readonly actionType: "redirectToQuestionnaire" | "showResult";
  readonly resultKey?: string;
  readonly redirectToQuestionnaire?: string;
  readonly conditions: readonly CompiledCondition[];
}

export interface CompiledQuestionnaire {
  readonly id: string;
  readonly version?: string;
  readonly name: string;
  readonly hiddenFromLandingPage: boolean;
  readonly title: string;
  readonly description?: string;
  readonly questions: readonly CompiledQuestion[];
  readonly steps: readonly CompiledStep[];
  readonly results: Readonly<Record<string, CompiledResult>>;
  readonly resultsLogic: readonly CompiledLogicRule[];
}

export interface CompiledDecisionManifest {
  readonly version: string;
  readonly questionnaires: readonly CompiledQuestionnaire[];
}

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);

const validateFlow = ajv.compile(flowSchema);

function assertRawFlow(flow: unknown): asserts flow is RawFlow {
  if (!validateFlow(flow)) {
    throw new Error(`Validation failed: ${validationErrors()}`);
  }
}

function parseCondition(
  conditionStr: string,
  questionAliasMap: Readonly<Record<string, string>>,
): CompiledCondition {
  const operators = {
    "==": "equals",
    "!=": "not_equals",
    includes: "includes",
    not_includes: "not_includes",
    in: "in",
    not_in: "not_in",
  } as const;
  const parts = conditionStr.match(
    /^\s*([\w_]+)\s+(==|!=|includes|not_includes|in|not_in)\s+(.+)\s*$/,
  );
  if (!parts) {
    throw new Error(`Invalid condition syntax: "${conditionStr}"`);
  }

  const [, alias, op, rawValue] = parts;
  const questionId = questionAliasMap[alias];
  if (!questionId && !alias.startsWith("_")) {
    throw new Error(`Question alias "${alias}" in condition "${conditionStr}" not found.`);
  }

  let value: unknown;
  try {
    value = JSON.parse(rawValue.replace(/'/g, '"')) as unknown;
  } catch {
    value = rawValue.replace(/^'|'$/g, "");
  }

  return {
    questionId: questionId || alias,
    operator: operators[op as keyof typeof operators],
    value,
  };
}

function validationErrors(): string {
  return (validateFlow.errors ?? [])
    .map((error) => `${error.instancePath || "root"}: ${error.message}`)
    .join(", ");
}

function assertUniqueOptionValues(flow: RawFlow): void {
  for (const [questionAlias, question] of Object.entries(flow.questions)) {
    const seenValues = new Map<string, string>();
    for (const option of question.options ?? []) {
      const valueKey = JSON.stringify(option.value);
      const previous = seenValues.get(valueKey);
      if (previous) {
        throw new Error(
          `Question "${questionAlias}" has duplicate option value ${valueKey} for options "${previous}" and "${option.text ?? option.id ?? valueKey}".`,
        );
      }
      seenValues.set(valueKey, option.text ?? option.id ?? valueKey);
    }
  }
}

function assertNoOrphanQuestions(flow: RawFlow): void {
  const referencedQuestionAliases = new Set(
    flow.steps.flatMap((step) => (Array.isArray(step.questions) ? step.questions : [])),
  );
  for (const questionAlias of Object.keys(flow.questions)) {
    if (!referencedQuestionAliases.has(questionAlias)) {
      throw new Error(
        `Orphan question alias "${questionAlias}": defined but not referenced by any step.`,
      );
    }
  }
}

function assertNoUnreachableResults(flow: RawFlow): void {
  const referencedResultAliases = new Set(
    flow.logic.map((rule) => rule.show).filter((resultAlias) => typeof resultAlias === "string"),
  );
  for (const resultAlias of Object.keys(flow.results)) {
    if (!referencedResultAliases.has(resultAlias)) {
      throw new Error(
        `Unreachable result alias "${resultAlias}": defined but not referenced by any show rule.`,
      );
    }
  }
}

function assertResultSources(flow: RawFlow): void {
  for (const [resultAlias, result] of Object.entries(flow.results)) {
    if (!Array.isArray(result.sources) || result.sources.length === 0) {
      throw new Error(`Result alias "${resultAlias}" must define at least one source.`);
    }
    for (const [sourceIndex, source] of result.sources.entries()) {
      if (!source?.url || typeof source.url !== "string" || !source.url.startsWith("https://")) {
        throw new Error(
          `Result alias "${resultAlias}" source ${sourceIndex + 1} must define an https url.`,
        );
      }
      if (!source.name && !source.label) {
        throw new Error(
          `Result alias "${resultAlias}" source ${sourceIndex + 1} must define a name or label.`,
        );
      }
    }
  }
}

function compileFlow(flow: RawFlow): CompiledQuestionnaire {
  assertUniqueOptionValues(flow);
  assertNoOrphanQuestions(flow);
  assertNoUnreachableResults(flow);
  assertResultSources(flow);

  const questionAliasMap: Record<string, string> = {};
  const resultAliasMap = new Set(Object.keys(flow.results));
  const processedQuestions = Object.entries(flow.questions).map(([alias, question], index) => {
    const questionId = question.id || `${flow.id}-q${index + 1}`;
    questionAliasMap[alias] = questionId;
    return {
      ...question,
      id: questionId,
      options: (question.options || []).map((option, optionIndex) => ({
        ...option,
        id: option.id || `${questionId}-o${optionIndex + 1}`,
      })),
      conditions: [],
    } satisfies CompiledQuestion;
  });

  const questionsWithConditions = processedQuestions.map((question) => {
    const alias = Object.keys(questionAliasMap).find(
      (key) => questionAliasMap[key] === question.id,
    );
    const originalQuestion = alias ? flow.questions[alias] : undefined;
    return {
      ...question,
      conditions: (originalQuestion?.conditions ?? []).map((condition) =>
        parseCondition(condition.if, questionAliasMap),
      ),
    } satisfies CompiledQuestion;
  });

  const processedSteps = flow.steps.map(
    (step, index) =>
      ({
        id: step.id || `${flow.id}-s${index + 1}`,
        title: step.title,
        description: step.description,
        questionIds: (step.questions || []).map((alias) => {
          const id = questionAliasMap[alias];
          if (!id) throw new Error(`Question alias "${alias}" in step "${step.title}" not found.`);
          return id;
        }),
      }) satisfies CompiledStep,
  );

  const processedResults = Object.entries(flow.results).reduce<Record<string, CompiledResult>>(
    (acc, [alias, result]) => {
      acc[alias] = {
        ...result,
        contraindications: (result.contraindications || []).map((contraindication, index) => ({
          id: `ci_${alias}_${index + 1}`,
          text:
            typeof contraindication === "string" ? contraindication : (contraindication.text ?? ""),
          checked: false,
        })),
      };
      return acc;
    },
    {},
  );

  const processedLogic = flow.logic.map((rule, index) => {
    const conditions = (rule.when || []).map((conditionStr) =>
      parseCondition(conditionStr, questionAliasMap),
    );
    if (rule.show && !resultAliasMap.has(rule.show)) {
      throw new Error(`Logic rule points to non-existent result alias "${rule.show}".`);
    }

    return {
      id: rule.id || `${flow.id}-rule-${index + 1}`,
      actionType: rule.redirect ? "redirectToQuestionnaire" : "showResult",
      resultKey: rule.show,
      redirectToQuestionnaire: rule.redirect,
      conditions,
    } satisfies CompiledLogicRule;
  });

  return {
    id: flow.id,
    version: flow.version,
    name: flow.name ?? flow.title,
    hiddenFromLandingPage: flow.hiddenFromLandingPage || false,
    title: flow.title,
    description: flow.description,
    questions: questionsWithConditions,
    steps: processedSteps,
    results: processedResults,
    resultsLogic: processedLogic,
  };
}

export async function compileFlowFiles(
  inputDir = "flows",
  options: BuildFlowsOptions = {},
): Promise<CompiledDecisionManifest> {
  options.logger?.info(pc.cyan("[buildFlows] Starting build process..."));
  const fullInputDir = path.resolve(inputDir);
  const flowFilePaths = (await glob(path.join(fullInputDir, "*.yaml"))).sort();
  const compiledQuestionnaires: CompiledQuestionnaire[] = [];

  if (flowFilePaths.length === 0) {
    throw new Error(`[buildFlows] No YAML flow files found in '${fullInputDir}'.`);
  }

  for (const filePath of flowFilePaths) {
    const fileName = path.basename(filePath);
    options.logger?.info(pc.cyan(`[buildFlows] Processing ${fileName}...`));

    try {
      const fileContent = await fs.readFile(filePath, "utf8");
      const flow = yaml.load(fileContent);
      assertRawFlow(flow);
      compiledQuestionnaires.push(compileFlow(flow));
    } catch (error) {
      throw new Error(`[buildFlows] Failed to process ${fileName}: ${(error as Error).message}`);
    }
  }

  return {
    version: "1.0.0",
    questionnaires: compiledQuestionnaires,
  };
}

export async function buildFlows(
  inputDir = "flows",
  outputFile = "public/main.json",
  options: BuildFlowsOptions = {},
): Promise<CompiledDecisionManifest> {
  const fullOutputFile = path.resolve(outputFile);
  const finalOutput = await compileFlowFiles(inputDir, options);
  await fs.mkdir(path.dirname(fullOutputFile), { recursive: true });
  await fs.writeFile(fullOutputFile, JSON.stringify(finalOutput, null, 2));
  options.logger?.success(pc.green(`[buildFlows] Successfully built ${fullOutputFile}!`));
  return finalOutput;
}
