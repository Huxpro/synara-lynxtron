import type { ComposerTrigger } from '@synara-web/composer-logic';

export interface ComposerNativeValueAck {
  readonly triggerAfterAck: ComposerTrigger | null;
  readonly value: string;
}

export function consumeComposerNativeValueAck(input: {
  readonly eventValue: string;
  readonly pending: ComposerNativeValueAck | null;
}): {
  readonly matched: boolean;
  readonly triggerAfterAck: ComposerTrigger | null;
} {
  if (!input.pending || input.pending.value !== input.eventValue) {
    return { matched: false, triggerAfterAck: null };
  }
  return {
    matched: true,
    triggerAfterAck: input.pending.triggerAfterAck,
  };
}
