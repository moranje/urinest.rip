/* eslint-disable security/detect-non-literal-fs-filename */
import fs from "node:fs/promises";
import path from "node:path";

export const flowSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://beslismodel.local/schemas/flow.schema.json",
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
        authoringContract: { enum: ["guideline-v1"] },
        landingDescription: { type: "string", pattern: "^[^<>\\u0000-\\u001f]*$" },
        landingOrder: { type: "number", minimum: 0 },
        landingSection: { enum: ["primary", "secondary"] },
        owner: { type: "string", pattern: "^[^<>\\u0000-\\u001f]*$" },
        privacyClass: { type: "string", pattern: "^[^<>\\u0000-\\u001f]*$" },
        reviewed: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        sourceIds: { type: "array", items: { type: "string" }, minItems: 1 },
      },
    },
    questions: { type: "object" },
    steps: { type: "array" },
    calculations: {
      anyOf: [{ type: "object" }, { type: "array" }],
    },
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
} as const;

export async function writeFlowSchema(outputFile: string): Promise<typeof flowSchema> {
  const fullOutputFile = path.resolve(outputFile);
  await fs.mkdir(path.dirname(fullOutputFile), { recursive: true });
  await fs.writeFile(fullOutputFile, `${JSON.stringify(flowSchema, null, 2)}\n`);
  return flowSchema;
}
