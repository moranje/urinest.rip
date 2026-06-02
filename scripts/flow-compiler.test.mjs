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
category: test
audience: [tester]
domain: test
recommendedStart: false
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
    sources:
      - name: Test source
        url: https://example.test/source
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
category: test
audience: [tester]
domain: test
recommendedStart: false
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
    sources:
      - name: Test source
        url: https://example.test/source
logic:
  - when: ["answer == yes"]
    show: ok
`);

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(
      'Orphan question alias "orphan": defined but not referenced by any step.',
    );
  });

  it("rejects unknown condition operators", async () => {
    const { flowsDir, outputFile } = await createFixture(`
id: unknown-operator
version: "1"
title: Unknown operator
category: test
audience: [tester]
domain: test
recommendedStart: false
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
    sources:
      - name: Test source
        url: https://example.test/source
logic:
  - when: ["answer === yes"]
    show: ok
`);

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(
      'Invalid condition syntax: "answer === yes"',
    );
  });

  it("rejects result aliases that no show rule can reach", async () => {
    const { flowsDir, outputFile } = await createFixture(`
id: unreachable-result
version: "1"
title: Unreachable result
category: test
audience: [tester]
domain: test
recommendedStart: false
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
    sources:
      - name: Test source
        url: https://example.test/source
  never:
    title: Never
    sources:
      - name: Test source
        url: https://example.test/source
logic:
  - when: ["answer == yes"]
    show: ok
`);

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(
      'Unreachable result alias "never": defined but not referenced by any show rule.',
    );
  });

  it("rejects results without source metadata", async () => {
    const { flowsDir, outputFile } = await createFixture(`
id: missing-source
version: "1"
title: Missing source
category: test
audience: [tester]
domain: test
recommendedStart: false
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
`);

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(
      'Result alias "ok" must define at least one source.',
    );
  });

  it.each([
    ["negative landing order", "  landingOrder: -1", "/metadata/landingOrder: must be >= 0"],
    [
      "unknown landing section",
      "  landingOrder: 10\n  landingSection: tertiary",
      "/metadata/landingSection: must be equal to one of the allowed values",
    ],
    [
      "HTML landing description",
      '  landingOrder: 10\n  landingDescription: "<script>alert(1)</script>"',
      "/metadata/landingDescription: must match pattern",
    ],
    [
      "unsafe metadata URL",
      '  landingOrder: 10\n  landingUrl: "https://example.test/<script>"',
      'Metadata "landingUrl" must not contain HTML or control characters.',
    ],
    [
      "unsafe metadata URL protocol",
      '  landingOrder: 10\n  landingUrl: "javascript:alert(1)"',
      'Metadata "landingUrl" must define an https url.',
    ],
    [
      "nested metadata object",
      '  landingOrder: 10\n  unsafe:\n    html: "<b>bad</b>"',
      "/metadata/unsafe: must match a schema in anyOf",
    ],
  ])("rejects malicious flow metadata: %s", async (_name, metadata, expectedError) => {
    const { flowsDir, outputFile } = await createFixture(`
id: malicious-metadata
version: "1"
title: Malicious metadata
category: test
audience: [tester]
domain: test
recommendedStart: false
metadata:
${metadata}
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
    sources:
      - name: Test source
        url: https://example.test/source
logic:
  - when: ["answer == yes"]
    show: ok
`);

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(expectedError);
  });

  it("rejects source URLs with unsafe characters", async () => {
    const { flowsDir, outputFile } = await createFixture(`
id: unsafe-source-url
version: "1"
title: Unsafe source url
category: test
audience: [tester]
domain: test
recommendedStart: false
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
    sources:
      - name: Test source
        url: https://example.test/<script>
logic:
  - when: ["answer == yes"]
    show: ok
`);

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(
      'Result alias "ok" source 1 must define an https url.',
    );
  });
});
