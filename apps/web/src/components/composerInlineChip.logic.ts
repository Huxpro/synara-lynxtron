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
