export interface AppConfig {
  manifestUrl: string;
  telemetrySource: string;
  storage: {
    answersKey: string;
    answersTtlMs: number;
    redirectChainKey: string;
    redirectChainTtlMs: number;
  };
}

export const appConfig: AppConfig = {
  manifestUrl: "/main.json",
  telemetrySource: "urinestrip",
  storage: {
    answersKey: "urinest-questionnaire-answers",
    answersTtlMs: 8 * 60 * 60 * 1000,
    redirectChainKey: "urinest-redirect-chain",
    redirectChainTtlMs: 5 * 60 * 1000,
  },
};
