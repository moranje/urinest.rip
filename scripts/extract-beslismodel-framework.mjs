import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const map = JSON.parse(readFileSync(join(root, "docs/package-extraction-map.json"), "utf8"));
const rootPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const packageLock = existsSync(join(root, "package-lock.json"))
  ? JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"))
  : { packages: {} };

const scriptFiles = [
  "scripts/check-package-bundle-budget.mjs",
  "scripts/check-compiler-package.mjs",
  "scripts/check-copd-care-package.mjs",
  "scripts/check-core-mutation-pilot.mjs",
  "scripts/check-core-package.mjs",
  "scripts/check-cvrm-prevent-package.mjs",
  "scripts/check-dm-care-package.mjs",
  "scripts/check-framework-security-boundaries.mjs",
  "scripts/check-package-extraction-map.mjs",
  "scripts/check-package-file-install-consumer-smoke.mjs",
  "scripts/check-package-publish-next.mjs",
  "scripts/check-package-registry-smoke.mjs",
  "scripts/check-package-release-config.mjs",
  "scripts/check-package-tarballs.mjs",
  "scripts/check-testing-package.mjs",
  "scripts/check-vue-package.mjs",
  "scripts/package-extraction-map.mjs",
];

const packageScripts = {
  "build:core":
    "vite build --config packages/core/vite.config.ts && tsc -p packages/core/tsconfig.json",
  "build:compiler":
    "vite build --config packages/compiler/vite.config.ts && tsc -p packages/compiler/tsconfig.json",
  "build:copd-care":
    "vite build --config packages/copd-care/vite.config.ts && tsc -p packages/copd-care/tsconfig.json",
  "build:cvrm-prevent":
    "vite build --config packages/cvrm-prevent/vite.config.ts && tsc -p packages/cvrm-prevent/tsconfig.json",
  "build:dm-care":
    "vite build --config packages/dm-care/vite.config.ts && tsc -p packages/dm-care/tsconfig.json",
  "build:testing":
    "vite build --config packages/testing/vite.config.ts && tsc -p packages/testing/tsconfig.json",
  "build:vue:only":
    "vite build --config packages/vue/vite.config.ts && tsc -p packages/vue/tsconfig.json",
  "build:vue": "npm run build:core && npm run build:vue:only",
  "build:packages":
    "npm run build:core && npm run build:compiler && npm run build:vue:only && npm run build:testing && npm run build:cvrm-prevent && npm run build:dm-care && npm run build:copd-care",
  check: "tsc --noEmit",
  "check:tsgo": "tsgo --noEmit --project tsconfig.tsgo.json",
  "check:compiler-package": "node scripts/check-compiler-package.mjs",
  "check:copd-care-package": "node scripts/check-copd-care-package.mjs",
  "check:core-package": "node scripts/check-core-package.mjs",
  "check:cvrm-prevent-package": "node scripts/check-cvrm-prevent-package.mjs",
  "check:dm-care-package": "node scripts/check-dm-care-package.mjs",
  "check:framework-boundaries": "node scripts/check-framework-security-boundaries.mjs",
  "check:mutation-pilot": "node scripts/check-core-mutation-pilot.mjs",
  "check:package-extraction-map": "node scripts/check-package-extraction-map.mjs",
  "check:package-file-install-consumer-smoke":
    "node scripts/check-package-file-install-consumer-smoke.mjs",
  "check:package-publish-next": "node scripts/check-package-publish-next.mjs",
  "check:package-registry-smoke": "node scripts/check-package-registry-smoke.mjs",
  "check:package-registry-smoke:config":
    "node scripts/check-package-registry-smoke.mjs --check-config",
  "check:package-bundle-budget": "node scripts/check-package-bundle-budget.mjs",
  "check:package-release-config": "node scripts/check-package-release-config.mjs",
  "check:package-tarballs": "node scripts/check-package-tarballs.mjs",
  "check:testing-package": "node scripts/check-testing-package.mjs",
  "check:vue-package": "node scripts/check-vue-package.mjs",
  "check:packages":
    "npm run check:framework-boundaries && npm run check:package-extraction-map && npm run check:package-release-config && npm run build:packages && npm run check:package-bundle-budget && npm run check:package-tarballs && npm run check:package-publish-next && npm run check:package-file-install-consumer-smoke && npm run check:package-registry-smoke:config && npm run check:core-package && npm run check:compiler-package && npm run check:cvrm-prevent-package && npm run check:dm-care-package && npm run check:copd-care-package && npm run check:vue-package && npm run check:testing-package && npm run check:mutation-pilot",
  "budget:packages": "node scripts/check-package-bundle-budget.mjs",
  "format:check": "oxfmt --check packages/ scripts/",
  lint: "oxlint packages/ scripts/ --deny-warnings",
  "lint:eslint": "eslint packages/ scripts/",
  "lint:all": "npm run lint && npm run lint:eslint",
  test: "vitest run",
};

const dependencyNames = [
  "@types/node",
  "@typescript/native-preview",
  "ajv",
  "ajv-formats",
  "eslint",
  "eslint-plugin-security",
  "glob",
  "js-yaml",
  "oxfmt",
  "oxlint",
  "picocolors",
  "pinia",
  "typescript",
  "typescript-eslint",
  "vite",
  "vitest",
  "vue",
  "vue-router",
];

function parseArgs() {
  const args = process.argv.slice(2);
  const targetIndex = args.indexOf("--target");
  if (targetIndex === -1 || !args[targetIndex + 1]) {
    throw new Error("Usage: node scripts/extract-beslismodel-framework.mjs --target <dir>");
  }
  return {
    linkNodeModules: args.includes("--link-node-modules"),
    target: resolve(args[targetIndex + 1]),
  };
}

function assertEmptyTarget(target) {
  if (!existsSync(target)) return;
  const entries = readdirSync(target).filter((entry) => entry !== ".DS_Store");
  if (entries.length > 0) {
    throw new Error(`Extraction target must be empty: ${target}`);
  }
}

function copyDirectory(source, destination) {
  cpSync(source, destination, {
    filter: (path) => !/(^|\/)(dist|node_modules|coverage)(\/|$)/u.test(path),
    recursive: true,
  });
}

function copyFile(source, destination) {
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination);
}

function packageDependencyVersion(name) {
  for (const pkg of map.packages) {
    const manifest = JSON.parse(readFileSync(join(root, pkg.packageJson), "utf8"));
    const declared =
      manifest.dependencies?.[name] ??
      manifest.devDependencies?.[name] ??
      manifest.peerDependencies?.[name] ??
      manifest.optionalDependencies?.[name];
    if (declared) return declared;
  }
  return undefined;
}

function dependencyVersion(name) {
  const declared =
    rootPackage.devDependencies?.[name] ??
    rootPackage.dependencies?.[name] ??
    rootPackage.optionalDependencies?.[name] ??
    packageDependencyVersion(name);
  if (declared) return declared;

  const lockVersion = packageLock.packages?.[`node_modules/${name}`]?.version;
  if (lockVersion) return `^${lockVersion}`;

  throw new Error(`No dependency version source for extracted framework dependency: ${name}`);
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeRootPackage(target) {
  writeJson(join(target, "package.json"), {
    name: "beslismodel-framework",
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: packageScripts,
    devDependencies: Object.fromEntries(
      dependencyNames
        .map((name) => [name, dependencyVersion(name)])
        .sort(([left], [right]) => left.localeCompare(right)),
    ),
    engines: {
      node: rootPackage.engines?.node ?? ">=20.19.0",
    },
  });
}

function writeTypeScriptConfigs(target) {
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      resolveJsonModule: true,
      isolatedModules: true,
      paths: {
        "@beslismodel/compiler": ["./packages/compiler/src/index.ts"],
        "@beslismodel/copd-care": ["./packages/copd-care/src/index.ts"],
        "@beslismodel/core": ["./packages/core/src/index.ts"],
        "@beslismodel/cvrm-prevent": ["./packages/cvrm-prevent/src/index.ts"],
        "@beslismodel/dm-care": ["./packages/dm-care/src/index.ts"],
        "@beslismodel/testing": ["./packages/testing/src/index.ts"],
        "@beslismodel/vue": ["./packages/vue/src/index.ts"],
      },
    },
    include: ["packages/**/*.ts"],
    exclude: ["node_modules", "packages/**/dist"],
  };

  writeJson(join(target, "tsconfig.json"), tsconfig);
  writeJson(join(target, "tsconfig.tsgo.json"), {
    extends: "./tsconfig.json",
    include: ["packages/**/*.ts"],
    exclude: ["packages/**/*.test.ts", "node_modules", "packages/**/dist"],
  });
}

function writeVitestConfig(target) {
  writeFileSync(
    join(target, "vitest.config.ts"),
    `import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@beslismodel/compiler": new URL("./packages/compiler/src/index.ts", import.meta.url).pathname,
      "@beslismodel/copd-care": new URL("./packages/copd-care/src/index.ts", import.meta.url).pathname,
      "@beslismodel/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@beslismodel/cvrm-prevent": new URL("./packages/cvrm-prevent/src/index.ts", import.meta.url).pathname,
      "@beslismodel/dm-care": new URL("./packages/dm-care/src/index.ts", import.meta.url).pathname,
      "@beslismodel/testing": new URL("./packages/testing/src/index.ts", import.meta.url).pathname,
      "@beslismodel/vue": new URL("./packages/vue/src/index.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    include: ["packages/**/*.test.ts"],
  },
});
`,
  );
}

function writeEslintConfig(target) {
  writeFileSync(
    join(target, "eslint.config.js"),
    `import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";

export default [
  {
    ignores: ["packages/**/dist/**", "coverage/**"],
  },
  {
    files: ["packages/**/*.ts", "scripts/**/*.mjs"],
    languageOptions: {
      parser: tseslint.parser,
      sourceType: "module",
    },
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules,
      "no-console": "error",
      "security/detect-object-injection": "off",
      "security/detect-unsafe-regex": "off",
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "security/detect-non-literal-regexp": "off",
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    rules: {
      "no-console": "off",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-non-literal-regexp": "off",
    },
  },
];
`,
  );
}

function writePackageCi(target) {
  mkdirSync(join(target, ".github/workflows"), { recursive: true });
  writeFileSync(
    join(target, ".github/workflows/ci.yml"),
    `name: Beslismodel Framework CI

on:
  push:
    branches: [main, master]
  pull_request:

permissions:
  contents: read

jobs:
  package-ci:
    name: Package CI / Node \${{ matrix.node-version }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node-version: [20, 22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v5
        with:
          node-version: \${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint:all
      - run: npm run check
      - run: npm run check:tsgo
      - run: npm run test
      - run: npm run check:packages
      - run: npm run budget:packages
      - run: npm audit --omit=dev --audit-level=high
      - name: Secret scan
        run: |
          ! git grep -nE '(service[_-]?role|VITE_SUPABASE|_authToken|app_logs)' -- packages scripts docs .github
      - name: Keep env files untracked
        run: |
          ! git ls-files --error-unmatch .env
`,
  );
}

function linkNodeModules(target) {
  symlinkSync(join(root, "node_modules"), join(target, "node_modules"), "dir");
}

function main() {
  const { linkNodeModules: shouldLinkNodeModules, target } = parseArgs();
  assertEmptyTarget(target);
  mkdirSync(target, { recursive: true });

  for (const pkg of map.packages) {
    copyDirectory(join(root, pkg.sourceRoot), join(target, pkg.destinationRoot));
  }

  for (const file of scriptFiles) {
    copyFile(join(root, file), join(target, file));
  }

  copyFile(join(root, ".npmrc.example"), join(target, ".npmrc.example"));
  for (const configFile of [".oxlintrc.json", ".oxfmtrc.json"]) {
    if (existsSync(join(root, configFile)))
      copyFile(join(root, configFile), join(target, configFile));
  }
  copyFile(
    join(root, "docs/package-extraction-map.json"),
    join(target, "docs/package-extraction-map.json"),
  );
  copyFile(
    join(root, "docs/package-release-strategy.md"),
    join(target, "docs/package-release-strategy.md"),
  );

  writeRootPackage(target);
  writeTypeScriptConfigs(target);
  writeVitestConfig(target);
  writeEslintConfig(target);
  writePackageCi(target);

  if (shouldLinkNodeModules) {
    linkNodeModules(target);
  }

  console.log(`Extracted beslismodel framework packages to ${target}`);
}

main();
