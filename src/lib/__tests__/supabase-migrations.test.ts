/* eslint-disable security/detect-non-literal-fs-filename */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("Supabase security migrations", () => {
  it("restricts admin reads and dashboard writes to admin policy checks", () => {
    const migration = read("supabase/migrations/007_harden_log_access.sql");

    expect(migration).toContain("create or replace function is_app_admin()");
    expect(migration).toContain('drop policy if exists "Authenticated users can read logs"');
    expect(migration).toContain('create policy "Admins can read logs"');
    expect(migration).toContain('create policy "Admins can manage resolutions"');
    expect(migration).toContain("using (is_app_admin())");
    expect(migration).toContain("with check (is_app_admin())");
  });

  it("moves anonymous log ingestion behind a validated RPC", () => {
    const migration = read("supabase/migrations/007_harden_log_access.sql");
    const logSink = read("src/lib/log-sink.ts");

    expect(migration).toContain('drop policy if exists "Anyone can insert logs"');
    expect(migration).toContain("create or replace function insert_app_logs(p_logs jsonb)");
    expect(migration).toContain("if v_count > 20 then");
    expect(migration).toContain("if octet_length(v_entry::text) > 32768 then");
    expect(migration).toContain("if v_source <> 'urinestrip' then");
    expect(migration).toContain("if v_limit.event_count > 120 then");
    expect(migration).toContain("raw clinical telemetry keys");
    expect(migration).toContain("unsanitized sensitive telemetry data");
    expect(migration).toContain("questionnaireId|answeredQuestionIds|resultKey");
    expect(migration).toContain("access_token|refresh_token|apikey|anon_key|token|key");
    expect(migration).toContain(
      "grant execute on function insert_app_logs(jsonb) to anon, authenticated",
    );
    expect(logSink).toContain('supabase.rpc("insert_app_logs"');
    expect(logSink).not.toContain('.from("app_logs").insert');
  });

  it("drops legacy unfiltered log RPCs", () => {
    const migration = read("supabase/migrations/007_harden_log_access.sql");

    expect(migration).toContain("drop function if exists get_grouped_logs(int, text, text)");
    expect(migration).toContain("drop function if exists get_recent_logs(text, int)");
    expect(migration).toContain(
      "grant execute on function get_grouped_logs_by_source(text, int, text, text) to authenticated",
    );
  });
});
