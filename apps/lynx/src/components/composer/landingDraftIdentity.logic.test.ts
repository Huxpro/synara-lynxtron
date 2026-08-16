import { describe, expect, it } from '@rstest/core';

import {
  CHAT_LANDING_DRAFT_ID,
  landingDraftId,
  STUDIO_LANDING_DRAFT_ID,
} from './landingDraftIdentity.logic';

describe('landing draft identity', () => {
  it('keeps chat compatibility while isolating Studio state', () => {
    expect(landingDraftId(undefined)).toBe(CHAT_LANDING_DRAFT_ID);
    expect(landingDraftId('chat')).toBe(CHAT_LANDING_DRAFT_ID);
    expect(landingDraftId('studio')).toBe(STUDIO_LANDING_DRAFT_ID);
    expect(STUDIO_LANDING_DRAFT_ID).not.toBe(CHAT_LANDING_DRAFT_ID);
  });
});
