import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const packageRoots = ["packages/core", "packages/compiler", "packages/vue", "packages/testing"];
const sourceExtensions = new Set([".ts", ".mts", ".cts", ".js", ".mjs", ".cjs"]);

const packageRules = {
  "packages/core": [
    ["Vue dependency", /(?:^|[^A-Za-z0-9_])(?:vue|pinia|vue-router)(?:[^A-Za-z0-9_]|$)/i],
    ["browser global", /(?:^|[^A-Za-z0-9_])(?:window|document)\s*\./i],
    ["direct fetch", /(?:^|[^A-Za-z0-9_])fetch\s*\(/i],
    ["app-specific Urinest name", /(?:urinest|urinestrip)/i],
    ["domain-specific CVRM/PREVENT name", /(?:cvrm|prevent)/i],
  ],
  "packages/compiler": [
    ["browser global", /(?:^|[^A-Za-z0-9_])(?:window|document)\s*\./i],
    ["runtime storage global", /(?:localStorage|sessionStorage)/i],
  ],
  "packages/vue": [
    ["browser global", /(?:^|[^A-Za-z0-9_])(?:window|document)\s*\./i],
    ["direct browser storage", /(?:localStorage|sessionStorage)/i],
    ["direct fetch", /(?:^|[^A-Za-z0-9_])fetch\s*\(/i],
  ],
  "packages/testing": [
    ["runtime storage global", /(?:localStorage|sessionStorage)/i],
    ["production telemetry sink", /(?:app_logs|log-sink|insert_app_logs)/i],
  ],
};

const sharedRules = [
  ["Supabase dependency", /@supabase\//i],
  ["Supabase hardcoding", /supabase/i],
  ["admin hardcoding", /(?:^|[^A-Za-z0-9_])admin(?:[^A-Za-z0-9_]|$)/i],
  ["app log table hardcoding", /app_logs/i],
  ["service-role key reference", /service[_-]?role/i],
  ["Vite app env hardcoding", /VITE_SUPABASE/i],
];

const hasSourceExtension = (path) => {
  const index = path.lastIndexOf(".");
  return index >= 0 && sourceExtensions.has(path.slice(index));
};

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return path;
  });

const sourceFiles = (packageRoot) =>
  walk(join(packageRoot, "src")).filter(
    (path) => hasSourceExtension(path) && !path.endsWith(".test.ts") && !path.endsWith(".d.ts"),
  );

const manifestForbiddenDependencies = ["@supabase/supabase-js", "dompurify", "marked"];
const vuePeerDependencies = ["vue", "pinia", "vue-router"];

const violations = [];

for (const packageRoot of packageRoots) {
  for (const file of sourceFiles(packageRoot)) {
    const source = readFileSync(file, "utf8");
    for (const [label, pattern] of [...sharedRules, ...(packageRules[packageRoot] ?? [])]) {
      if (pattern.test(source)) {
        violations.push(`${relative(process.cwd(), file)}: ${label}`);
      }
    }
  }

  const packageJsonPath = join(packageRoot, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const dependencyNames = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
    ...Object.keys(packageJson.optionalDependencies ?? {}),
  ]);

  for (const dependency of manifestForbiddenDependencies) {
    if (dependencyNames.has(dependency)) {
      violations.push(
        `${relative(process.cwd(), packageJsonPath)}: forbidden dependency ${dependency}`,
      );
    }
  }

  for (const dependency of vuePeerDependencies) {
    if (dependencyNames.has(dependency) && packageRoot !== "packages/vue") {
      violations.push(
        `${relative(process.cwd(), packageJsonPath)}: Vue dependency must stay in @beslismodel/vue`,
      );
    }
  }

  if (dependencyNames.has("@supabase/supabase-js")) {
    violations.push(`${relative(process.cwd(), packageJsonPath)}: Supabase must stay app-only`);
  }
}

if (violations.length > 0) {
  throw new Error(
    `Framework security boundary violation:\n${violations.map((item) => `- ${item}`).join("\n")}`,
  );
}

console.log("Framework packages keep app/admin/Supabase/storage boundaries clean");
