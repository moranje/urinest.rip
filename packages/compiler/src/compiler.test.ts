/* eslint-disable security/detect-non-literal-fs-filename */
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildFlows } from "./compiler";
import { decisionEngine } from "./plugin";

const tempDirs: string[] = [];

async function createFixture(flowYaml: string) {
  const dir = await mkdtemp(join(tmpdir(), "beslismodel-compiler-"));
  const flowsDir = join(dir, "flows");
  const outputFile = join(dir, "public", "main.json");
  await mkdir(flowsDir);
  await writeFile(join(flowsDir, "fixture.yaml"), flowYaml);
  tempDirs.push(dir);
  return { dir, flowsDir, outputFile };
}

const validFlow = `
id: example-flow
version: "1"
title: Example flow
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

describe("compiler package", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("builds a standalone manifest from YAML flows", async () => {
    const { flowsDir, outputFile } = await createFixture(validFlow);

    const manifest = await buildFlows(flowsDir, outputFile);
    const written = JSON.parse(await readFile(outputFile, "utf8")) as typeof manifest;

    expect(written).toEqual(manifest);
    expect(manifest.questionnaires[0]).toEqual(
      expect.objectContaining({
        id: "example-flow",
        resultsLogic: [
          expect.objectContaining({
            actionType: "showResult",
            resultKey: "ok",
          }),
        ],
      }),
    );
  });

  it("rejects duplicate option values", async () => {
    const { flowsDir, outputFile } = await createFixture(
      validFlow.replace(
        "      - text: Yes\n        value: yes",
        "      - text: Yes\n        value: yes\n      - text: Also yes\n        value: yes",
      ),
    );

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(
      'Question "answer" has duplicate option value "yes"',
    );
  });

  it("rejects unknown condition operators", async () => {
    const { flowsDir, outputFile } = await createFixture(
      validFlow.replace('when: ["answer == yes"]', 'when: ["answer === yes"]'),
    );

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(
      'Invalid condition syntax: "answer === yes"',
    );
  });

  it("rejects result aliases that no show rule can reach", async () => {
    const { flowsDir, outputFile } = await createFixture(`
id: unreachable-result
version: "1"
title: Unreachable result
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
  never:
    title: Never
logic:
  - when: ["answer == yes"]
    show: ok
`);

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(
      'Unreachable result alias "never": defined but not referenced by any show rule.',
    );
  });

  it("exposes a Vite-compatible plugin build hook", async () => {
    const { dir } = await createFixture(validFlow);
    const plugin = decisionEngine({
      flowsDir: "flows",
      outputFile: "plugin/main.json",
    });

    plugin.configResolved({ root: dir });
    await plugin.buildStart();

    const written = JSON.parse(await readFile(join(dir, "plugin", "main.json"), "utf8"));
    expect(written.questionnaires[0]).toEqual(
      expect.objectContaining({
        id: "example-flow",
      }),
    );
  });
});
