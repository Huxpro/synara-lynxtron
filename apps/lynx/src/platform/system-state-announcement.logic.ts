import {
  resolveSystemStateSemantics,
  type SystemStateIntent,
} from "@synara-web/components/systemStateSemantics";

export interface SystemStateAnnouncementDecision {
  readonly content: string | null;
  readonly nextKey: string | null;
}

export type SystemStateAnnouncementInput =
  | string
  | number
  | null
  | undefined
  | readonly SystemStateAnnouncementInput[];

export function normalizeSystemStateAnnouncement(announcement: unknown): string {
  if (typeof announcement === "string" || typeof announcement === "number") {
    return String(announcement);
  }
  if (Array.isArray(announcement)) {
    return announcement.map(normalizeSystemStateAnnouncement).join("");
  }
  return "";
}

export function resolveNextSystemStateAnnouncement(input: {
  readonly previousKey: string | null;
  readonly intent: SystemStateIntent;
  readonly announcement?: SystemStateAnnouncementInput;
}): SystemStateAnnouncementDecision {
  const content = normalizeSystemStateAnnouncement(input.announcement).trim();
  if (!resolveSystemStateSemantics(input.intent).announce || content.length === 0) {
    return { content: null, nextKey: null };
  }
  const nextKey = `${input.intent}:${content}`;
  if (nextKey === input.previousKey) {
    return { content: null, nextKey };
  }
  return { content, nextKey };
}
