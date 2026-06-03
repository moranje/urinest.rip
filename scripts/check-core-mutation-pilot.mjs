import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const mutants = [
  {
    name: "outcome-invalid-rules-win",
    file: "packages/core/src/outcome.ts",
    testFile: "packages/core/src/outcome.test.ts",
    from: "if (isValid && matchedCount > highestMatchedCount) {",
    to: "if (!isValid && matchedCount > highestMatchedCount) {",
  },
  {
    name: "graph-start-question-skips-wrong-node",
    file: "packages/core/src/graph.ts",
    testFile: "packages/core/src/graph.test.ts",
    from: "searching = questionId === startQuestionId;",
    to: "searching = questionId !== startQuestionId;",
  },
];

const runVitest = (testFile) =>
  execFileSync("vitest", ["run", testFile], {
    encoding: "utf8",
    stdio: "pipe",
  });

const survivors = [];
const testFiles = [...new Set(mutants.map((mutant) => mutant.testFile))];

for (const testFile of testFiles) {
  runVitest(testFile);
}

for (const mutant of mutants) {
  const original = readFileSync(mutant.file, "utf8");
  if (!original.includes(mutant.from)) {
    throw new Error(`${mutant.name}: mutation point missing in ${mutant.file}`);
  }

  const mutated = original.replace(mutant.from, mutant.to);

  try {
    writeFileSync(mutant.file, mutated);
    runVitest(mutant.testFile);
    survivors.push(mutant.name);
  } catch {
    // Expected: targeted tests fail when the mutant is alive in source.
  } finally {
    writeFileSync(mutant.file, original);
  }
}

if (survivors.length > 0) {
  throw new Error(`Core mutation pilot survived mutants: ${survivors.join(", ")}`);
}

console.log(`Core mutation pilot killed ${mutants.length} representative mutants`);
