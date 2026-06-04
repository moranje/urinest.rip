import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const basicFlowYaml = `
id: smoke-fixture
version: "1"
title: Smoke fixture
category: test
audience: [tester]
domain: test
recommendedStart: true
metadata:
  landingSection: primary
  landingOrder: 1
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

const stripFlowYaml = `
id: strip
version: "1"
title: Urinestrip
description: Fixture for package consumer smoke.
category: diagnostiek
audience: [behandelaar, triagist]
domain: urineonderzoek
icon: strip
recommendedStart: true
metadata:
  landingOrder: 20
  landingSection: primary
questions:
  nitrite:
    id: q_strip_nitrite
    text: Nitriet test
    type: select
    options:
      - id: o_strip_nit_pos
        text: Positief
        value: positive
      - id: o_strip_nit_neg
        text: Negatief
        value: negative
  leukocytes:
    id: q_strip_leuko
    text: Leukocyten test
    type: select
    conditions:
      - if: "nitrite == negative"
    options:
      - id: o_strip_leuko_1
        text: "+"
        value: positive_1
      - id: o_strip_leuko_neg
        text: Negatief
        value: negative
  erythrocytes:
    id: q_strip_ery
    text: Erytrocyten test
    type: select
    conditions:
      - if: "nitrite == negative"
      - if: "leukocytes == negative"
    options:
      - id: o_strip_ery_1
        text: "+"
        value: positive_1
      - id: o_strip_ery_neg
        text: Negatief
        value: negative
steps:
  - id: s_strip_1
    title: Nitriet
    questions: [nitrite]
  - id: s_strip_2
    title: Leukocyten
    questions: [leukocytes]
  - id: s_strip_3
    title: Erytrocyten
    questions: [erythrocytes]
results:
  other.noConclusiveAbnormality:
    title: Geen afwijkingen gevonden
    sources:
      - name: Test source
        url: https://example.test/urinestrip
logic:
  - when: ["nitrite == positive"]
    redirect: bacteriurie
  - when: ["nitrite == negative", "leukocytes == positive_1"]
    redirect: leukocyturie
  - when: ["nitrite == negative", "leukocytes == negative", "erythrocytes == positive_1"]
    redirect: hematurie
  - when: ["nitrite == negative", "leukocytes == negative", "erythrocytes == negative"]
    show: other.noConclusiveAbnormality
`;

const linkedFlowYaml = (id, title) => `
id: ${id}
version: "1"
title: ${title}
description: Fixture target for package consumer smoke.
category: diagnostiek
audience: [behandelaar, triagist]
domain: urineonderzoek
recommendedStart: false
metadata:
  landingOrder: 90
  landingSection: secondary
questions:
  confirmation:
    id: q_${id}_confirmation
    text: Confirmation
    type: select
    options:
      - text: Yes
        value: yes
steps:
  - id: s_${id}_confirmation
    title: Confirmation
    questions: [confirmation]
results:
  ok:
    title: ${title} ok
    sources:
      - name: Test source
        url: https://example.test/${id}
logic:
  - when: ["confirmation == yes"]
    show: ok
`;

export function writeBasicFlowFixture(flowsDir, id = "smoke-fixture", title = "Smoke fixture") {
  mkdirSync(flowsDir, { recursive: true });
  writeFileSync(
    join(flowsDir, "fixture.yaml"),
    basicFlowYaml.replace("smoke-fixture", id).replace("Smoke fixture", title),
  );
}

export function writeUrinestripFixtureFlows(flowsDir) {
  mkdirSync(flowsDir, { recursive: true });
  writeFileSync(join(flowsDir, "strip.yaml"), stripFlowYaml);
  writeFileSync(join(flowsDir, "bacteriurie.yaml"), linkedFlowYaml("bacteriurie", "Bacteriurie"));
  writeFileSync(
    join(flowsDir, "leukocyturie.yaml"),
    linkedFlowYaml("leukocyturie", "Leukocyturie"),
  );
  writeFileSync(join(flowsDir, "hematurie.yaml"), linkedFlowYaml("hematurie", "Hematurie"));
}
