export interface AppConfig {
  manifestUrl: string;
  telemetrySource: string;
  errorMessages: {
    auth: {
      emailUnconfirmed: string;
      generic: string;
      invalidLogin: string;
      rateLimited: string;
      sessionExpired: string;
    };
    database: {
      busy: string;
      conflict: string;
      constraint: string;
      duplicateField: string;
      duplicateFallback: string;
      forbidden: string;
      generic: string;
      notFound: string;
      relationMissing: string;
    };
    http: {
      forbidden: string;
      invalid: string;
      notFound: string;
      rateLimited: string;
      rateLimitedWithRetry: string;
      server: string;
      sessionExpired: string;
      unknown: string;
    };
    network: {
      offline: string;
      timeout: string;
      unreachable: string;
    };
    unknown: string;
  };
  storage: {
    answersKey: string;
    answersTtlMs: number;
    redirectChainKey: string;
    redirectChainTtlMs: number;
  };
}

export const appConfig: AppConfig = {
  errorMessages: {
    auth: {
      emailUnconfirmed: "E-mailadres nog niet bevestigd.",
      generic: "Authenticatie fout. Probeer het opnieuw.",
      invalidLogin: "Ongeldig e-mailadres of wachtwoord.",
      rateLimited: "Te veel pogingen. Probeer het later opnieuw.",
      sessionExpired: "Sessie verlopen. Log opnieuw in.",
    },
    database: {
      busy: "Database is tijdelijk bezet. Probeer het opnieuw.",
      conflict: "Gelijktijdige wijziging. Probeer het opnieuw.",
      constraint: "Invoer voldoet niet aan de databasevoorwaarden.",
      duplicateField: "{field} bestaat al.",
      duplicateFallback: "Dit item bestaat al.",
      forbidden: "Je hebt geen toegang tot deze gegevens.",
      generic: "Database fout. Probeer het opnieuw.",
      notFound: "Item niet gevonden.",
      relationMissing: "Gerelateerde gegevens niet gevonden.",
    },
    http: {
      forbidden: "Je hebt geen toegang tot deze gegevens.",
      invalid: "Controleer de ingevoerde gegevens.",
      notFound: "Niet gevonden.",
      rateLimited: "Te veel pogingen. Probeer het later opnieuw.",
      rateLimitedWithRetry: "Te veel pogingen. Probeer het over {seconds} seconden opnieuw.",
      server: "Serverfout. Probeer het opnieuw.",
      sessionExpired: "Sessie verlopen. Log opnieuw in.",
      unknown: "Er ging iets mis. Probeer het opnieuw.",
    },
    network: {
      offline: "Geen internetverbinding. Controleer je netwerk.",
      timeout: "Server reageert niet. Probeer het opnieuw.",
      unreachable: "Server niet bereikbaar. Probeer het opnieuw.",
    },
    unknown: "Er ging iets mis. Probeer het opnieuw.",
  },
  manifestUrl: "/main.json",
  telemetrySource: "urinestrip",
  storage: {
    answersKey: "urinest-questionnaire-answers",
    answersTtlMs: 8 * 60 * 60 * 1000,
    redirectChainKey: "urinest-redirect-chain",
    redirectChainTtlMs: 5 * 60 * 1000,
  },
};
