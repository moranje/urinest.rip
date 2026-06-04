import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const guide = readFileSync("docs/ai-guideline-authoring.md", "utf8");

describe("AI guideline authoring documentation", () => {
  it("documents evidence, role, language, telemetry and validation requirements", () => {
    for (const requiredPhrase of [
      "Geen klinische claim komt in de UI zonder bronverdediging.",
      "Per-Domein Acceptatiechecklisttemplate",
      "geen open",
      "projectstatus voor deze repo",
      "Question Defense Matrix",
      "authoringContract: guideline-v1",
      "`publisher`",
      "`version`",
      "`checkedOn`",
      "`appliesTo`",
      "`limitations`",
      "Role Responsibility Matrix",
      "`arts`",
      "`triagist`",
      "`doktersassistent`",
      "`verpleegkundige`",
      "`poh`",
      "Info-knoppen",
      "Gebruikersvriendelijke Taal",
      "Telemetry En Privacy",
      "npm run check:guidelines",
      "Calculators zitten in domeinpackages, niet in core.",
    ]) {
      expect(guide).toContain(requiredPhrase);
    }
  });
});
