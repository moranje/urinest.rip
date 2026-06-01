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
    hiddenFromLandingPage: { type: "boolean" },
    questions: { type: "object" },
    steps: { type: "array" },
    results: { type: "object" },
    logic: { type: "array" },
  },
  required: ["id", "title", "questions", "steps", "results", "logic"],
  additionalProperties: true,
} as const;

export async function writeFlowSchema(outputFile: string): Promise<typeof flowSchema> {
  const fullOutputFile = path.resolve(outputFile);
  await fs.mkdir(path.dirname(fullOutputFile), { recursive: true });
  await fs.writeFile(fullOutputFile, `${JSON.stringify(flowSchema, null, 2)}\n`);
  return flowSchema;
}
