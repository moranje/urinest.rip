#!/usr/bin/env node
/* eslint-disable no-console */
import process from "node:process";
import { buildFlows } from "./compiler";
import { writeFlowSchema } from "./schema";

function printHelp(): void {
  console.log(`Usage:
  beslismodel build --flows <dir> --out <file>
  beslismodel schema --out <file>

Options:
  --flows <dir>  Directory with YAML flow files. Defaults to "flows".
  --out <file>   Output JSON file. Defaults to "public/main.json".
  --help         Show this help text.`);
}

function readOption(args: readonly string[], name: string, fallback: string): string {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${name}`);
  }
  return value;
}

async function main(args: readonly string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const command = args[0];
  if (command === "schema") {
    await writeFlowSchema(readOption(args, "--out", "flow.schema.json"));
    return;
  }

  if (command !== "build") {
    throw new Error(`Unknown command "${command ?? ""}". Expected "build" or "schema".`);
  }

  await buildFlows(
    readOption(args, "--flows", "flows"),
    readOption(args, "--out", "public/main.json"),
    {
      logger: {
        info: (message) => console.log(message),
        success: (message) => console.log(message),
      },
    },
  );
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
