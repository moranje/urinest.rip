import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyRegistryMigration,
  buildRegistryMigrationPlan,
} from "./migrate-to-beslismodel-registry.mjs";

const tempDirs = [];

async function createMigrationFixture() {
  const dir = await mkdtemp(join(tmpdir(), "beslismodel-registry-migration-"));
  tempDirs.push(dir);
  await mkdir(join(dir, "docs"), { recursive: true });

  await writeFile(
    join(dir, "docs/package-extraction-map.json"),
    JSON.stringify(
      {
        packages: [
          {
            name: "@beslismodel/core",
            sourceRoot: "packages/core",
            packageJson: "packages/core/package.json",
          },
          {
            name: "@beslismodel/vue",
            sourceRoot: "packages/vue",
            packageJson: "packages/vue/package.json",
          },
          {
            name: "@beslismodel/compiler",
            sourceRoot: "packages/compiler",
            packageJson: "packages/compiler/package.json",
          },
          {
            name: "@beslismodel/testing",
            sourceRoot: "packages/testing",
            packageJson: "packages/testing/package.json",
          },
        ],
      },
      null,
      2,
    ),
  );
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: "consumer",
        type: "module",
        dependencies: {
          vue: "^3.5.0",
        },
        devDependencies: {
          vitest: "^4.0.0",
        },
      },
      null,
      2,
    ),
  );
  await writeFile(
    join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          paths: {
            "@beslismodel/core": ["./packages/core/src/index.ts"],
            "@beslismodel/vue": ["./packages/vue/src/index.ts"],
            "@/*": ["./src/*"],
          },
        },
        include: ["src/**/*.ts", "packages/**/*.ts", "env.d.ts"],
      },
      null,
      2,
    ),
  );
  await writeFile(
    join(dir, "vite.config.js"),
    `export default {
  resolve: {
    alias: {
      "@beslismodel/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@beslismodel/vue": new URL("./packages/vue/src/index.ts", import.meta.url).pathname,
    },
  },
  build: {},
};
`,
  );
  await writeFile(
    join(dir, "vitest.config.ts"),
    `export default {
  plugins: [],
  resolve: {
    alias: {
      "@beslismodel/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@beslismodel/vue": new URL("./packages/vue/src/index.ts", import.meta.url).pathname,
      "@beslismodel/compiler": new URL("./packages/compiler/src/index.ts", import.meta.url).pathname,
      "@beslismodel/testing": new URL("./packages/testing/src/index.ts", import.meta.url).pathname,
    },
  },
  test: {},
};
`,
  );

  return dir;
}

describe("beslismodel registry migration", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("plans exact registry dependencies and alias removal without writing by default", async () => {
    const root = await createMigrationFixture();

    const plan = buildRegistryMigrationPlan(root, "0.1.0-next.0");

    expect(plan.filter((item) => item.changed).map((item) => item.path)).toEqual([
      "package.json",
      "tsconfig.json",
      "vite.config.js",
      "vitest.config.ts",
    ]);
    expect(await readFile(join(root, "package.json"), "utf8")).not.toContain("@beslismodel/core");
  });

  it("writes exact registry deps and removes local package source aliases", async () => {
    const root = await createMigrationFixture();

    expect(applyRegistryMigration({ root, version: "0.1.0-next.0", write: true }).sort()).toEqual([
      "package.json",
      "tsconfig.json",
      "vite.config.js",
      "vitest.config.ts",
    ]);

    const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
    expect(manifest.dependencies["@beslismodel/core"]).toBe("0.1.0-next.0");
    expect(manifest.dependencies["@beslismodel/vue"]).toBe("0.1.0-next.0");
    expect(manifest.devDependencies["@beslismodel/compiler"]).toBe("0.1.0-next.0");
    expect(manifest.devDependencies["@beslismodel/testing"]).toBe("0.1.0-next.0");

    expect(await readFile(join(root, "tsconfig.json"), "utf8")).not.toContain("packages/**/*.ts");
    expect(await readFile(join(root, "vite.config.js"), "utf8")).not.toContain("@beslismodel/");
    expect(await readFile(join(root, "vitest.config.ts"), "utf8")).not.toContain("@beslismodel/");
  });

  it("requires an exact version", async () => {
    const root = await createMigrationFixture();

    expect(() => buildRegistryMigrationPlan(root, "^0.1.0")).toThrow("Set an exact registry");
  });
});
