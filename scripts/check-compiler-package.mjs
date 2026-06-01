import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { buildFlows, decisionEngine } from "../packages/compiler/dist/index.js";

const execFileAsync = promisify(execFile);

const flowYaml = `
id: package-smoke
version: "1"
title: Package smoke
questions:
  answer:
    text: Answer
    type: select
    options:
      - text: Yes
        value: yes
steps:
  - title: Start
    questions: [answer]
results:
  ok:
    title: Ok
logic:
  - when: ["answer == yes"]
    show: ok
`;

const tempDir = await mkdtemp(join(tmpdir(), "beslismodel-compiler-package-"));

try {
  const flowsDir = join(tempDir, "flows");
  const apiOutput = join(tempDir, "api", "main.json");
  const cliOutput = join(tempDir, "cli", "main.json");
  const pluginOutput = join(tempDir, "plugin", "main.json");
  await mkdir(flowsDir);
  await writeFile(join(flowsDir, "fixture.yaml"), flowYaml);

  const manifest = await buildFlows(flowsDir, apiOutput);
  if (manifest.questionnaires[0]?.id !== "package-smoke") {
    throw new Error("compiler package API export failed");
  }

  await execFileAsync(process.execPath, [
    new URL("../packages/compiler/dist/cli.js", import.meta.url).pathname,
    "build",
    "--flows",
    flowsDir,
    "--out",
    cliOutput,
  ]);
  const cliManifest = JSON.parse(await readFile(cliOutput, "utf8"));
  if (cliManifest.questionnaires[0]?.id !== "package-smoke") {
    throw new Error("compiler package CLI export failed");
  }

  const plugin = decisionEngine({
    flowsDir,
    outputFile: pluginOutput,
  });
  plugin.configResolved({ root: tempDir });
  await plugin.buildStart();
  const pluginManifest = JSON.parse(await readFile(pluginOutput, "utf8"));
  if (pluginManifest.questionnaires[0]?.id !== "package-smoke") {
    throw new Error("compiler package plugin export failed");
  }

  console.log("@beslismodel/compiler package exports ok");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
