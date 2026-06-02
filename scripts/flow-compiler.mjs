import path from "node:path";
import fs from "node:fs/promises";
import yaml from "js-yaml";
import { glob } from "glob";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import pc from "picocolors";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const flowSchema = {
  type: "object",
  properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+$" },
    version: { type: "string" },
    name: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    category: { type: "string" },
    audience: { type: "array", items: { type: "string" }, minItems: 1 },
    domain: { type: "string" },
    icon: { type: "string" },
    hiddenFromLandingPage: { type: "boolean" },
    recommendedStart: { type: "boolean" },
    metadata: {
      type: "object",
      additionalProperties: {
        anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { type: "null" }],
      },
      properties: {
        landingDescription: { type: "string", pattern: "^[^<>\\u0000-\\u001f]*$" },
        landingOrder: { type: "number", minimum: 0 },
        landingSection: { enum: ["primary", "secondary"] },
      },
    },
    questions: { type: "object" },
    steps: { type: "array" },
    results: { type: "object" },
    logic: { type: "array" },
  },
  required: [
    "id",
    "title",
    "category",
    "audience",
    "domain",
    "recommendedStart",
    "questions",
    "steps",
    "results",
    "logic",
  ],
  additionalProperties: true,
};

const validateFlow = ajv.compile(flowSchema);

function parseCondition(conditionStr, questionAliasMap) {
  const operators = {
    "==": "equals",
    "!=": "not_equals",
    includes: "includes",
    not_includes: "not_includes",
    in: "in",
    not_in: "not_in",
  };
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

  let value;
  try {
    value = JSON.parse(rawValue.replace(/'/g, '"'));
  } catch {
    value = rawValue.replace(/^'|'$/g, "");
  }

  return {
    questionId: questionId || alias,
    operator: operators[op],
    value,
  };
}

function validationErrors() {
  return (validateFlow.errors ?? [])
    .map((error) => `${error.instancePath || "root"}: ${error.message}`)
    .join(", ");
}

function assertUniqueOptionValues(flow) {
  for (const [questionAlias, question] of Object.entries(flow.questions)) {
    const seenValues = new Map();
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

function assertNoOrphanQuestions(flow) {
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

function assertNoUnreachableResults(flow) {
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

function assertResultSources(flow) {
  for (const [resultAlias, result] of Object.entries(flow.results)) {
    if (!Array.isArray(result.sources) || result.sources.length === 0) {
      throw new Error(`Result alias "${resultAlias}" must define at least one source.`);
    }
    for (const [sourceIndex, source] of result.sources.entries()) {
      if (!source?.url || typeof source.url !== "string" || !isHttpsUrl(source.url)) {
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

const LANDING_SECTIONS = new Set(["primary", "secondary"]);
const URL_METADATA_KEY = /(url|uri|href|link)$/i;

function hasControlCharacter(value) {
  return [...value].some((character) => character.charCodeAt(0) < 32);
}

function isHttpsUrl(value) {
  if (value.includes("<") || value.includes(">") || hasControlCharacter(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function assertSafeMetadataString(key, value) {
  if (value.includes("<") || value.includes(">") || hasControlCharacter(value)) {
    throw new Error(`Metadata "${key}" must not contain HTML or control characters.`);
  }
  if (URL_METADATA_KEY.test(key) && !isHttpsUrl(value)) {
    throw new Error(`Metadata "${key}" must define an https url.`);
  }
}

function assertSafeFlowMetadata(flow) {
  if (!flow.metadata) return;

  for (const [key, value] of Object.entries(flow.metadata)) {
    if (key === "landingOrder") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new Error('Metadata "landingOrder" must be a finite non-negative number.');
      }
      continue;
    }
    if (key === "landingSection") {
      if (typeof value !== "string" || !LANDING_SECTIONS.has(value)) {
        throw new Error('Metadata "landingSection" must be "primary" or "secondary".');
      }
      continue;
    }
    if (typeof value === "string") {
      assertSafeMetadataString(key, value);
      continue;
    }
    if (value === null || typeof value === "boolean") continue;
    if (typeof value === "number" && Number.isFinite(value)) continue;
    throw new Error(`Metadata "${key}" must be a string, number, boolean or null.`);
  }
}

export async function buildFlows(inputDir = "flows", outputFile = "public/main.json") {
  console.log(pc.cyan("[buildFlows] Starting build process..."));
  const fullInputDir = path.resolve(inputDir);
  const fullOutputFile = path.resolve(outputFile);
  const flowFilePaths = (await glob(path.join(fullInputDir, "*.yaml"))).sort();
  const compiledQuestionnaires = [];

  if (flowFilePaths.length === 0) {
    throw new Error(`[buildFlows] No YAML flow files found in '${fullInputDir}'.`);
  }

  for (const filePath of flowFilePaths) {
    const fileName = path.basename(filePath);
    console.log(pc.cyan(`[buildFlows] Processing ${fileName}...`));

    try {
      const fileContent = await fs.readFile(filePath, "utf8");
      const flow = yaml.load(fileContent);
      if (!validateFlow(flow)) {
        throw new Error(`Validation failed: ${validationErrors()}`);
      }
      assertUniqueOptionValues(flow);
      assertNoOrphanQuestions(flow);
      assertNoUnreachableResults(flow);
      assertResultSources(flow);
      assertSafeFlowMetadata(flow);

      const questionAliasMap = {};
      const resultAliasMap = new Set(Object.keys(flow.results));
      const processedQuestions = Object.entries(flow.questions).map(([alias, question], index) => {
        const questionId = question.id || `${flow.id}-q${index + 1}`;
        questionAliasMap[alias] = questionId;
        return {
          ...question,
          id: questionId,
          options: (question.options || []).map((option, optionIndex) => ({
            ...option,
            id: `${questionId}-o${optionIndex + 1}`,
          })),
          conditions: [],
        };
      });

      processedQuestions.forEach((question) => {
        const alias = Object.keys(questionAliasMap).find(
          (key) => questionAliasMap[key] === question.id,
        );
        const originalQuestion = flow.questions[alias];
        if (originalQuestion.conditions) {
          question.conditions = originalQuestion.conditions.map((condition) =>
            parseCondition(condition.if, questionAliasMap),
          );
        }
      });

      const processedSteps = flow.steps.map((step, index) => ({
        id: step.id || `${flow.id}-s${index + 1}`,
        title: step.title,
        description: step.description,
        questionIds: (step.questions || []).map((alias) => {
          const id = questionAliasMap[alias];
          if (!id) throw new Error(`Question alias "${alias}" in step "${step.title}" not found.`);
          return id;
        }),
      }));

      const processedResults = Object.entries(flow.results).reduce((acc, [alias, result]) => {
        acc[alias] = {
          ...result,
          contraindications: (result.contraindications || []).map((contraindication, index) => ({
            id: `ci_${alias}_${index + 1}`,
            text: contraindication.text || contraindication,
            checked: false,
          })),
        };
        return acc;
      }, {});

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
        };
      });

      compiledQuestionnaires.push({
        id: flow.id,
        version: flow.version,
        name: flow.name ?? flow.title,
        category: flow.category,
        audience: flow.audience,
        domain: flow.domain,
        icon: flow.icon,
        hiddenFromLandingPage: flow.hiddenFromLandingPage || false,
        recommendedStart: flow.recommendedStart,
        metadata: flow.metadata,
        title: flow.title,
        description: flow.description,
        questions: processedQuestions,
        steps: processedSteps,
        results: processedResults,
        resultsLogic: processedLogic,
      });
    } catch (error) {
      throw new Error(`[buildFlows] Failed to process ${fileName}: ${error.message}`);
    }
  }

  const finalOutput = {
    version: "1.0.0",
    questionnaires: compiledQuestionnaires,
  };
  await fs.mkdir(path.dirname(fullOutputFile), { recursive: true });
  await fs.writeFile(fullOutputFile, JSON.stringify(finalOutput, null, 2));
  console.log(pc.green(`[buildFlows] Successfully built ${fullOutputFile}!`));
}

export function decisionEngine(options = {}) {
  const { flowsDir = "flows", outputFile = "public/main.json" } = options;
  let root = process.cwd();

  const runBuild = async () => {
    const fullFlowsDir = path.resolve(root, flowsDir);
    const fullOutputFile = path.resolve(root, outputFile);
    await buildFlows(fullFlowsDir, fullOutputFile);
  };

  return {
    name: "vite-plugin-decision-engine-strict",
    configResolved(resolvedConfig) {
      root = resolvedConfig.root;
    },
    async buildStart() {
      await runBuild();
    },
    configureServer(server) {
      const flowsPath = path.resolve(root, flowsDir, "**/*.yaml");
      server.watcher.add(flowsPath);
      const handleChange = async (filePath) => {
        if (!filePath.startsWith(path.resolve(root, flowsDir))) return;
        console.log(
          pc.cyan(
            `[vite-plugin-decision-engine] Flow file changed: ${path.basename(filePath)}. Rebuilding...`,
          ),
        );
        await runBuild();
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", handleChange);
      server.watcher.on("change", handleChange);
      server.watcher.on("unlink", handleChange);
    },
  };
}
