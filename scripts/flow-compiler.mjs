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
    hiddenFromLandingPage: { type: "boolean" },
    questions: { type: "object" },
    steps: { type: "array" },
    results: { type: "object" },
    logic: { type: "array" },
  },
  required: ["id", "title", "questions", "steps", "results", "logic"],
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
        hiddenFromLandingPage: flow.hiddenFromLandingPage || false,
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
