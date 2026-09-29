import { useEffect, useRef } from "@lynx-js/react";

import type { SystemStateIntent } from "@synara-web/components/systemStateSemantics";

import {
  resolveNextSystemStateAnnouncement,
  type SystemStateAnnouncementInput,
} from "./system-state-announcement.logic";

interface LynxAccessibilityApi {
  accessibilityAnnounce?: (options: { readonly content: string }, callback: () => void) => void;
}

export function useLynxSystemStateAnnouncement(input: {
  readonly intent: SystemStateIntent;
  readonly announcement?: SystemStateAnnouncementInput;
}) {
  const previousKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const decision = resolveNextSystemStateAnnouncement({
      previousKey: previousKeyRef.current,
      intent: input.intent,
      announcement: input.announcement,
    });
    previousKeyRef.current = decision.nextKey;
    if (!decision.content) return;

    (lynx as unknown as LynxAccessibilityApi).accessibilityAnnounce?.(
      { content: decision.content },
      () => {},
    );
  }, [input.announcement, input.intent]);
}
