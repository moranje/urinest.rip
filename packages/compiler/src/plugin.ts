import path from "node:path";
import pc from "picocolors";
import { buildFlows, type BuildFlowsOptions } from "./compiler";

export interface DecisionEnginePluginOptions extends BuildFlowsOptions {
  readonly flowsDir?: string;
  readonly outputFile?: string;
}

interface ResolvedConfigLike {
  readonly root: string;
}

interface WatcherLike {
  add(path: string): void;
  on(
    event: "add" | "change" | "unlink",
    callback: (filePath: string) => void | Promise<void>,
  ): void;
}

interface DevServerLike {
  readonly watcher: WatcherLike;
  readonly ws: {
    send(payload: { type: "full-reload" }): void;
  };
}

export interface DecisionEnginePlugin {
  readonly name: "vite-plugin-decision-engine-strict";
  configResolved(resolvedConfig: ResolvedConfigLike): void;
  buildStart(): Promise<void>;
  configureServer(server: DevServerLike): void;
}

export function decisionEngine(options: DecisionEnginePluginOptions = {}): DecisionEnginePlugin {
  const { flowsDir = "flows", outputFile = "public/main.json", logger } = options;
  let root = process.cwd();

  const runBuild = async () => {
    const fullFlowsDir = path.resolve(root, flowsDir);
    const fullOutputFile = path.resolve(root, outputFile);
    await buildFlows(fullFlowsDir, fullOutputFile, { logger });
  };

  return {
    name: "vite-plugin-decision-engine-strict",
    configResolved(resolvedConfig) {
      root = resolvedConfig.root;
    },
    async buildStart() {
      await runBuild();
    },
    configureServer(server) {
      const fullFlowsDir = path.resolve(root, flowsDir);
      const flowsPath = path.resolve(root, flowsDir, "**/*.yaml");
      server.watcher.add(flowsPath);
      const handleChange = async (filePath: string) => {
        if (!filePath.startsWith(fullFlowsDir)) return;
        logger?.info(
          pc.cyan(
            `[vite-plugin-decision-engine] Flow file changed: ${path.basename(filePath)}. Rebuilding...`,
          ),
        );
        await runBuild();
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", handleChange);
      server.watcher.on("change", handleChange);
      server.watcher.on("unlink", handleChange);
    },
  };
}
