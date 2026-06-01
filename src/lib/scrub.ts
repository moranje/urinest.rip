const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const JWT_RE = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const TOKEN_PARAM_RE = /([?&](?:access_token|refresh_token|apikey|anon_key|token|key)=)[^&\s]+/gi;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi;
const ISO_DATE_RE = /\b(?:19|20)\d{2}-\d{2}-\d{2}\b/g;
const NL_DATE_RE = /\b\d{2}-\d{2}-(?:19|20)\d{2}\b/g;
const BSN_CANDIDATE_RE = /\b\d{9}\b/g;

export interface ScrubStats {
  hits: number;
}

export interface ScrubResult<T> {
  value: T;
  stats: ScrubStats;
}

export function isValidBsn(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  const digits = value.split("").map(Number);
  const sum = digits.slice(0, 8).reduce((acc, digit, index) => acc + digit * (9 - index), 0);
  return (sum - digits[8]) % 11 === 0;
}

export function scrubText(input: string, stats: ScrubStats = { hits: 0 }): string {
  let output = input.replace(BSN_CANDIDATE_RE, (candidate) => {
    if (!isValidBsn(candidate)) return candidate;
    stats.hits += 1;
    return "***SCRUBBED-BSN***";
  });

  output = output.replace(EMAIL_RE, () => {
    stats.hits += 1;
    return "***SCRUBBED-EMAIL***";
  });
  output = output.replace(JWT_RE, () => {
    stats.hits += 1;
    return "***SCRUBBED-JWT***";
  });
  output = output.replace(TOKEN_PARAM_RE, (_match, prefix: string) => {
    stats.hits += 1;
    return `${prefix}***SCRUBBED-TOKEN***`;
  });
  output = output.replace(BEARER_RE, () => {
    stats.hits += 1;
    return "Bearer ***SCRUBBED-TOKEN***";
  });
  output = output.replace(ISO_DATE_RE, () => {
    stats.hits += 1;
    return "***SCRUBBED-DATE***";
  });
  output = output.replace(NL_DATE_RE, () => {
    stats.hits += 1;
    return "***SCRUBBED-DATE***";
  });

  return output;
}

export function scrubValue<T>(input: T, maxDepth = 4): ScrubResult<T> {
  const stats: ScrubStats = { hits: 0 };
  const seen = new WeakSet<object>();

  const scrub = (value: unknown, depth: number): unknown => {
    if (typeof value === "string") return scrubText(value, stats);
    if (value == null || typeof value !== "object") return value;
    if (value instanceof Date) return value.toISOString();
    if (depth <= 0) return "[Max depth]";
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((item) => scrub(item, depth - 1));
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        scrubText(key, stats),
        scrub(entry, depth - 1),
      ]),
    );
  };

  return { value: scrub(input, maxDepth) as T, stats };
}
