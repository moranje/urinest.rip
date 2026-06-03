import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { getFrameworkPackages } from "./package-extraction-map.mjs";

const consumerRoots = ["src", "fixtures"];
const sourceExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".mts", ".cts", ".vue"]);
const packageNamePattern = `(?:${getFrameworkPackages()
  .map((item) => item.name.replace("@beslismodel/", ""))
  .join("|")})`;
const forbiddenPatterns = [
  new RegExp(
    String.raw`(?:^|["'\`])@beslismodel\/${packageNamePattern}\/(?:src|dist)(?:\/|["'\`]|$)`,
  ),
  new RegExp(
    String.raw`(?:^|["'\`])(?:\.\.?\/)+packages\/${packageNamePattern}\/(?:src|dist)(?:\/|["'\`]|$)`,
  ),
  new RegExp(String.raw`packages\/${packageNamePattern}\/src\/`),
];

const hasSourceExtension = (path) => {
  const index = path.lastIndexOf(".");
  return index >= 0 && sourceExtensions.has(path.slice(index));
};

// Config aliases still point to local package builds until registry extraction.
const isConsumerSourceFile = (path) =>
  hasSourceExtension(path) && !path.endsWith(".config.ts") && !path.endsWith(".config.mts");

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return isConsumerSourceFile(path) ? [path] : [];
  });

const files = consumerRoots.flatMap((root) => walk(root));
const violations = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(source)) {
      violations.push(relative(process.cwd(), file));
      break;
    }
  }
}

if (violations.length > 0) {
  throw new Error(
    `Consumer package boundary violation. Use public @beslismodel/* exports only:\n${violations
      .map((file) => `- ${file}`)
      .join("\n")}`,
  );
}

console.log("Consumer package imports use public @beslismodel/* exports");
