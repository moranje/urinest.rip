/* eslint-disable security/detect-non-literal-fs-filename */
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildFlows } from "./compiler";
import { decisionEngine } from "./plugin";
import { writeFlowSchema } from "./schema";

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
category: test
audience: [tester]
domain: test
icon: example
recommendedStart: true
metadata:
  landingOrder: 10
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
`;

const strictAuthoringFlow = `
id: strict-domain-flow
version: "1"
title: Strict domain flow
category: chronic-care
audience: [arts, poh]
domain: cvrm
recommendedStart: true
metadata:
  authoringContract: guideline-v1
  sourceIds: [nhg-cvrm]
  reviewed: "2026-06-02"
  owner: clinical-owner
  privacyClass: no-free-text
questions:
  answer:
    text: Rookt de patient?
    type: select
    metadata:
      sourceIds: [nhg-cvrm]
      questionPurpose: "Rookstatus beinvloedt risicoberekening en advies."
      placementReason: "Vroeg nodig voor cardiovasculaire risicoschatting."
      roleVisibility:
        arts: "Mag beleid bepalen op basis van risicoprofiel."
        poh: "Mag intake voorbereiden binnen protocol."
      omissionRisk: "Risico kan te laag worden ingeschat."
      answerModel:
        type: select
        values: [yes, no, unknown]
        invalidStates: [missing]
      copyRationale: "Korte vraag zonder calculatorjargon."
      privacyClass: indirect-clinical
      infoButton:
        needed: true
        text: "Gebruik actuele rookstatus; ex-roken alleen als nee wanneer bron dat toestaat."
        sourceIds: [nhg-cvrm]
    options:
      - text: Ja
        value: yes
        metadata:
          sourceIds: [nhg-cvrm]
          optionDefense: "Ja activeert rookstatus als risicofactor."
          infoButton:
            needed: false
            reason: "Optietekst is eenduidig."
      - text: Nee
        value: no
        metadata:
          sourceIds: [nhg-cvrm]
          optionDefense: "Nee laat niet-roken route toe."
          infoButton:
            needed: false
            reason: "Optietekst is eenduidig."
      - text: Onbekend
        value: unknown
        metadata:
          sourceIds: [nhg-cvrm]
          optionDefense: "Onbekend voorkomt valse precisie."
          safeRoute: "Vraag aanvullen voordat definitieve risicoberekening wordt gebruikt."
          infoButton:
            needed: false
            reason: "Onbekend is gewone veilige fallback."
steps:
  - title: Start
    questions: [answer]
results:
  ok:
    title: Ok
    sources:
      - name: NHG CVRM
        url: https://example.test/nhg-cvrm
logic:
  - when: ["answer == yes"]
    show: ok
  - when: ["answer == no"]
    show: ok
  - when: ["answer == unknown"]
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
        icon: "example",
        metadata: { landingOrder: 10 },
        resultsLogic: [
          expect.objectContaining({
            id: "example-flow-rule-1",
            actionType: "showResult",
            resultKey: "ok",
          }),
        ],
      }),
    );
  });

  it("accepts strict authoring defenses for new domain flows", async () => {
    const { flowsDir, outputFile } = await createFixture(strictAuthoringFlow);

    const manifest = await buildFlows(flowsDir, outputFile);

    expect(manifest.questionnaires[0]).toEqual(
      expect.objectContaining({
        id: "strict-domain-flow",
        metadata: expect.objectContaining({
          authoringContract: "guideline-v1",
          sourceIds: ["nhg-cvrm"],
        }),
        questions: [
          expect.objectContaining({
            metadata: expect.objectContaining({
              questionPurpose: expect.any(String),
              roleVisibility: expect.objectContaining({
                arts: expect.any(String),
              }),
            }),
            options: expect.arrayContaining([
              expect.objectContaining({
                metadata: expect.objectContaining({
                  optionDefense: expect.any(String),
                }),
              }),
            ]),
          }),
        ],
      }),
    );
  });

  it("compiles generic calculator bindings for score-driven guideline decisions", async () => {
    const { flowsDir, outputFile } = await createFixture(`
id: cvrm-score-flow
version: "1"
title: CVRM score flow
category: cvrm
audience: [arts, poh]
domain: cvrm
recommendedStart: true
questions:
  age:
    id: q_age
    text: Leeftijd
    type: number
    options: []
  sex:
    id: q_sex
    text: Geslacht
    type: select
    options:
      - text: Man
        value: M
      - text: Vrouw
        value: F
  smoking:
    id: q_smoking
    text: Roken
    type: boolean
    options:
      - text: Ja
        value: true
      - text: Nee
        value: false
  systolic_bp:
    id: q_sbp
    text: Systolische bloeddruk
    type: number
    options: []
  total_cholesterol:
    id: q_total_cholesterol
    text: Totaal cholesterol
    type: number
    options: []
  hdl:
    id: q_hdl
    text: HDL
    type: number
    options: []
steps:
  - title: Start
    metadata:
      inputMode: group
    questions: [age, sex, smoking, systolic_bp, total_cholesterol, hdl]
calculations:
  score2:
    calculatorId: cvrm.score2
    input:
      age: { source: answer, key: age, coerce: number }
      sex: { source: answer, key: sex }
      smoking: { source: answer, key: smoking, coerce: boolean }
      systolicBp: { source: answer, key: systolic_bp, coerce: number }
      totalCholesterol: { source: answer, key: total_cholesterol, coerce: number }
      hdlCholesterol: { source: answer, key: hdl, coerce: number }
      region: { source: context, key: riskRegion, required: false }
    outputs:
      _score2_percent: { path: riskPercent }
      _score2_class: { path: riskClass.label }
results:
  intensive_cvrm:
    title: Intensief CVRM
    sources:
      - name: NHG CVRM
        url: https://example.test/nhg-cvrm
logic:
  - when: ["_score2_class == hoog"]
    show: intensive_cvrm
`);

    const manifest = await buildFlows(flowsDir, outputFile);
    expect(manifest.questionnaires[0]?.calculations).toEqual([
      {
        id: "score2",
        calculatorId: "cvrm.score2",
        input: expect.objectContaining({
          age: { source: "answer", key: "q_age", coerce: "number" },
          systolicBp: { source: "answer", key: "q_sbp", coerce: "number" },
          region: { source: "context", key: "riskRegion", required: false },
        }),
        outputs: {
          _score2_percent: { path: "riskPercent" },
          _score2_class: { path: "riskClass.label" },
        },
        conditions: [],
        metadata: undefined,
      },
    ]);
    expect(manifest.questionnaires[0]?.steps[0]).toEqual(
      expect.objectContaining({
        metadata: { inputMode: "group" },
        questionIds: ["q_age", "q_sex", "q_smoking", "q_sbp", "q_total_cholesterol", "q_hdl"],
      }),
    );
    expect(manifest.questionnaires[0]?.resultsLogic[0]?.conditions).toEqual([
      { questionId: "_score2_class", operator: "equals", value: "hoog" },
    ]);
  });

  it("rejects invalid calculator bindings", async () => {
    const { flowsDir, outputFile } = await createFixture(`
id: invalid-calculation-flow
version: "1"
title: Invalid calculation flow
category: cvrm
audience: [arts]
domain: cvrm
recommendedStart: true
questions:
  age:
    text: Leeftijd
    type: number
    options: []
steps:
  - title: Start
    questions: [age]
calculations:
  score2:
    input:
      age: { source: answer, key: age, coerce: integer }
    outputs:
      _score2_percent: { path: riskPercent }
results:
  ok:
    title: Ok
    sources:
      - name: Test
        url: https://example.test/test
logic:
  - when: ["_score2_percent == 1"]
    show: ok
`);

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(
      'Calculation "score2" must define calculatorId.',
    );
  });

  it.each([
    [
      "question purpose",
      '      questionPurpose: "Rookstatus beinvloedt risicoberekening en advies."\n',
      'Question "answer" metadata.questionPurpose must be a non-empty string.',
    ],
    [
      "option defense",
      '          optionDefense: "Ja activeert rookstatus als risicofactor."\n',
      'Question "answer" option "Ja" metadata.optionDefense must be a non-empty string.',
    ],
    [
      "info button defense",
      '      infoButton:\n        needed: true\n        text: "Gebruik actuele rookstatus; ex-roken alleen als nee wanneer bron dat toestaat."\n        sourceIds: [nhg-cvrm]\n',
      'Question "answer" metadata.infoButton must document whether explanatory UI is needed.',
    ],
  ])("rejects strict authoring flows without %s", async (_name, snippet, expectedError) => {
    const { flowsDir, outputFile } = await createFixture(strictAuthoringFlow.replace(snippet, ""));

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(expectedError);
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
    const { flowsDir, outputFile } = await createFixture(
      validFlow.replace("metadata:\n  landingOrder: 10", `metadata:\n${metadata}`),
    );

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(expectedError);
  });

  it("rejects source URLs with unsafe characters", async () => {
    const { flowsDir, outputFile } = await createFixture(
      validFlow.replace("url: https://example.test/source", "url: https://example.test/<script>"),
    );

    await expect(buildFlows(flowsDir, outputFile)).rejects.toThrow(
      'Result alias "ok" source 1 must define an https url.',
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

  it("writes the public flow JSON schema", async () => {
    const { dir } = await createFixture(validFlow);
    const outputFile = join(dir, "schema", "flow.schema.json");

    const schema = await writeFlowSchema(outputFile);
    const written = JSON.parse(await readFile(outputFile, "utf8")) as typeof schema;

    expect(written).toEqual(schema);
    expect(written.required).toEqual([
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
    ]);
    expect(written.properties.metadata).toEqual(
      expect.objectContaining({
        additionalProperties: expect.objectContaining({
          anyOf: expect.arrayContaining([expect.objectContaining({ type: "string" })]),
        }),
        properties: expect.objectContaining({
          landingDescription: expect.objectContaining({ type: "string" }),
          landingOrder: expect.objectContaining({ minimum: 0, type: "number" }),
          landingSection: expect.objectContaining({ enum: ["primary", "secondary"] }),
        }),
      }),
    );
  });
});
