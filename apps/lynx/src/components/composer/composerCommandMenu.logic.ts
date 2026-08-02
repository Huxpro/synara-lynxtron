import type { ComposerTrigger } from '@synara-web/composer-logic';
import { replaceTextRange } from '@synara-web/composer-logic';
import {
  ensureLeadingSpaceForReplacement,
  extendReplacementRangeForTrailingSpace,
} from '@synara-web/composerTriggerInsertion';
import {
  formatComposerMentionToken,
  skillMentionPrefix,
} from '@synara-web/lib/composerMentions';
import type {
  ProviderKind,
  ProviderSkillReference,
} from '@synara/contracts';
import {
  buildSubagentsPrompt,
  filterComposerSlashCommands,
} from '@synara-web/composerSlashCommands';
import type { ComposerCommandItem } from '@synara-web/components/chat/ComposerCommandMenuComposition';

const LYNX_SUPPORTED_SLASH_COMMANDS = [
  'plan',
  'default',
  'subagents',
] as const;

export function buildLynxSlashCommandItems(
  query: string
): ComposerCommandItem[] {
  return filterComposerSlashCommands(
    query,
    LYNX_SUPPORTED_SLASH_COMMANDS
  ).map((definition) => ({
    id: `slash:${definition.command}`,
    type: 'slash-command' as const,
    command: definition.command,
    label: definition.label,
    description: definition.description,
    source: definition.source,
  }));
}

export interface LynxSlashCommandTransition {
  readonly prompt: string;
  readonly interactionMode: 'plan' | 'default' | null;
  readonly selectionEnd: number;
  readonly selectionStart: number;
}

export interface LynxThreadMentionTransition {
  readonly mention: Extract<ComposerCommandItem, { type: 'thread' }>['mention'];
  readonly prompt: string;
  readonly selectionEnd: number;
  readonly selectionStart: number;
}

export interface LynxSkillTransition {
  readonly prompt: string;
  readonly selectionEnd: number;
  readonly selectionStart: number;
  readonly skill: ProviderSkillReference;
}

export function resolveLynxSkillSelection(input: {
  readonly item: ComposerCommandItem;
  readonly prompt: string;
  readonly provider: ProviderKind;
  readonly trigger: ComposerTrigger;
}): LynxSkillTransition | null {
  if (input.item.type !== 'skill' || input.trigger.kind !== 'skill') return null;
  const replacement = ensureLeadingSpaceForReplacement(
    input.prompt,
    input.trigger.rangeStart,
    `${skillMentionPrefix(input.provider)}${input.item.skill.name} `
  );
  const replacementRangeEnd = extendReplacementRangeForTrailingSpace(
    input.prompt,
    input.trigger.rangeEnd,
    replacement
  );
  const next = replaceTextRange(
    input.prompt,
    input.trigger.rangeStart,
    replacementRangeEnd,
    replacement
  );
  return {
    prompt: next.text,
    selectionStart: next.cursor,
    selectionEnd: next.cursor,
    skill: {
      name: input.item.skill.name,
      path: input.item.skill.path,
    },
  };
}

export function resolveLynxSlashCommandSelection(input: {
  readonly item: ComposerCommandItem;
  readonly prompt: string;
  readonly trigger: ComposerTrigger;
}): LynxSlashCommandTransition | null {
  if (input.item.type !== 'slash-command') return null;

  if (input.item.command === 'plan' || input.item.command === 'default') {
    const replacement = replaceTextRange(
      input.prompt,
      input.trigger.rangeStart,
      input.trigger.rangeEnd,
      ''
    );
    return {
      prompt: replacement.text,
      interactionMode: input.item.command,
      selectionStart: replacement.cursor,
      selectionEnd: replacement.cursor,
    };
  }

  if (input.item.command === 'subagents') {
    const replacement = replaceTextRange(
      input.prompt,
      input.trigger.rangeStart,
      input.trigger.rangeEnd,
      buildSubagentsPrompt('')
    );
    return {
      prompt: replacement.text,
      interactionMode: null,
      selectionStart: replacement.cursor,
      selectionEnd: replacement.cursor,
    };
  }

  return null;
}

export function resolveLynxThreadMentionSelection(input: {
  readonly item: ComposerCommandItem;
  readonly prompt: string;
  readonly trigger: ComposerTrigger;
}): LynxThreadMentionTransition | null {
  if (input.item.type !== 'thread' || input.trigger.kind !== 'mention') {
    return null;
  }
  const replacement = ensureLeadingSpaceForReplacement(
    input.prompt,
    input.trigger.rangeStart,
    `${formatComposerMentionToken(input.item.mention.name)} `
  );
  const replacementRangeEnd = extendReplacementRangeForTrailingSpace(
    input.prompt,
    input.trigger.rangeEnd,
    replacement
  );
  const next = replaceTextRange(
    input.prompt,
    input.trigger.rangeStart,
    replacementRangeEnd,
    replacement
  );
  return {
    mention: input.item.mention,
    prompt: next.text,
    selectionStart: next.cursor,
    selectionEnd: next.cursor,
  };
}
