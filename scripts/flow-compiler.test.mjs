import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { buildFlows } from "./flow-compiler.mjs";

const tempDirs = [];

async function createFixture(flowYaml) {
  const dir = await mkdtemp(join(tmpdir(), "urinest-flow-compiler-"));
  const flowsDir = join(dir, "flows");
  const outputFile = join(dir, "public", "main.json");
  await mkdir(flowsDir);
  await writeFile(join(flowsDir, "fixture.yaml"), flowYaml);
  tempDirs.push(dir);
  return { flowsDir, outputFile };
}

describe("flow compiler", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("rejects duplicate option values per question", async () => {
    const { flowsDir, outputFile } = await createFixture(`
id: duplicate-options
version: "1"
title: Duplicate options
questions:
  answer:
    text: Answer
    type: select
    options:
      - text: First
        value: yes
      - text: Second
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
`);

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(
      'Question "answer" has duplicate option value "yes"',
    );
  });

  it("rejects questions that are not referenced by any step", async () => {
    const { flowsDir, outputFile } = await createFixture(`
id: orphan-question
version: "1"
title: Orphan question
questions:
  answer:
    text: Answer
    type: select
    options:
      - text: Yes
        value: yes
  orphan:
    text: Orphan
    type: select
    options:
      - text: No
        value: no
steps:
  - title: Start
    questions: [answer]
results:
  ok:
    title: Ok
logic:
  - when: ["answer == yes"]
    show: ok
`);

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(
      'Orphan question alias "orphan": defined but not referenced by any step.',
    );
  });
});
