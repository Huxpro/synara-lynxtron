import {
  resolveSystemStateSemantics,
  type SystemStateIntent,
} from '@synara-web/components/systemStateSemantics';

export interface SystemStateAnnouncementDecision {
  readonly content: string | null;
  readonly nextKey: string | null;
}

export function resolveNextSystemStateAnnouncement(input: {
  readonly previousKey: string | null;
  readonly intent: SystemStateIntent;
  readonly announcement?: string;
}): SystemStateAnnouncementDecision {
  const content = input.announcement?.trim() ?? '';
  if (!resolveSystemStateSemantics(input.intent).announce || content.length === 0) {
    return { content: null, nextKey: null };
  }
  const nextKey = `${input.intent}:${content}`;
  if (nextKey === input.previousKey) {
    return { content: null, nextKey };
  }
  return { content, nextKey };
}
