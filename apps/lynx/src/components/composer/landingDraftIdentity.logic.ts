export const CHAT_LANDING_DRAFT_ID = 'lynx-landing-draft';
export const STUDIO_LANDING_DRAFT_ID = 'lynx-studio-landing-draft';

export function landingDraftId(
  containerKind: 'chat' | 'studio' | undefined
): string {
  return containerKind === 'studio'
    ? STUDIO_LANDING_DRAFT_ID
    : CHAT_LANDING_DRAFT_ID;
}
