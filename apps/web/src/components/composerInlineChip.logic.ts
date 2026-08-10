// FILE: composerInlineChip.logic.ts
// Purpose: Dependency-free inline token labels shared by Web and Lynx renderers.
// Layer: shared chat presentation logic

function formatComposerInlineTokenLabel(name: string): string {
  return name
    .split(/[-_]/)
    .map((segment) =>
      segment.length > 0
        ? segment.charAt(0).toUpperCase() + segment.slice(1)
        : segment
    )
    .join(' ');
}

export function formatComposerSkillChipLabel(name: string): string {
  return formatComposerInlineTokenLabel(name);
}

export function formatComposerSlashCommandChipLabel(command: string): string {
  return formatComposerInlineTokenLabel(command);
}

export interface AgentChipColor {
  readonly bg: string;
  readonly text: string;
}

export const DEFAULT_AGENT_CHIP_COLOR: AgentChipColor = {
  bg: "rgb(245 158 11 / 0.15)",
  text: "rgb(245 158 11)",
};

const AGENT_CHIP_COLOR_BY_NAME: Readonly<Record<string, AgentChipColor>> = {
  violet: { bg: "rgb(139 92 246 / 0.15)", text: "rgb(139 92 246)" },
  fuchsia: { bg: "rgb(217 70 239 / 0.15)", text: "rgb(217 70 239)" },
  teal: { bg: "rgb(20 184 166 / 0.15)", text: "rgb(20 184 166)" },
  cyan: { bg: "rgb(6 182 212 / 0.15)", text: "rgb(6 182 212)" },
  amber: DEFAULT_AGENT_CHIP_COLOR,
  orange: { bg: "rgb(249 115 22 / 0.15)", text: "rgb(249 115 22)" },
};

export function resolveAgentChipColor(color: string | undefined): AgentChipColor {
  return (color ? AGENT_CHIP_COLOR_BY_NAME[color] : undefined) ?? DEFAULT_AGENT_CHIP_COLOR;
}
