import { describe, expect, it } from "@rstest/core";
import type { ProviderSkillDescriptor } from "@synara/contracts";

import {
  buildSettingsSkillGroups,
  buildSettingsSkillSections,
  nextDisabledSkillNames,
  settingsSkillNameKey,
} from "./settingsSkills.logic";

function skill(
  name: string,
  scope: string,
  path: string,
  input: Partial<ProviderSkillDescriptor> = {},
): ProviderSkillDescriptor {
  return {
    name,
    scope,
    path,
    enabled: true,
    ...input,
  };
}

describe("Settings Skills projection", () => {
  it("normalizes names and groups provider copies once", () => {
    const groups = buildSettingsSkillGroups([
      skill("Review", "claude", "/claude/review/SKILL.md"),
      skill("review", "codex", "/codex/review/SKILL.md", {
        interface: {
          displayName: "Review",
          shortDescription: "Review changes.",
        },
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      key: "review",
      displayName: "Review",
      description: "Review changes.",
      section: "shared",
      providers: ["codex", "claudeAgent"],
    });
    expect(groups[0]?.sources.map((source) => source.label)).toEqual(["Codex", "Claude"]);
  });

  it("orders shared, Synara, provider, and unknown sections", () => {
    const sections = buildSettingsSkillSections([
      skill("shared", "codex", "/codex/shared"),
      skill("SHARED", "claude", "/claude/shared"),
      skill("portable", "synara", "/synara/portable"),
      skill("provider", "cursor", "/cursor/provider"),
      skill("personal", "custom", "/custom/personal"),
    ]);

    expect(sections.map((section) => section.title)).toEqual([
      "Shared skills",
      "From Synara",
      "From Cursor",
      "From custom",
    ]);
  });

  it("uses stable display fallback and alphabetical rows", () => {
    const groups = buildSettingsSkillGroups([
      skill("zeta", "synara", "/zeta"),
      skill("alpha", "synara", "/alpha", {
        description: "Alpha description.",
      }),
    ]);

    expect(groups.map((group) => group.displayName)).toEqual(["alpha", "zeta"]);
    expect(groups[0]?.description).toBe("Alpha description.");
    expect(groups[1]?.description).toBe("No description.");
  });

  it("builds sorted disabled names without clobbering prior toggles", () => {
    expect(
      nextDisabledSkillNames({
        current: ["Zeta"],
        skillName: "Alpha",
        enabled: false,
      }),
    ).toEqual(["alpha", "zeta"]);
    expect(
      nextDisabledSkillNames({
        current: ["alpha", "zeta"],
        skillName: "ZETA",
        enabled: true,
      }),
    ).toEqual(["alpha"]);
    expect(settingsSkillNameKey(" Review ")).toBe("review");
  });
});
