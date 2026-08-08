import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx whole-message assistant references', () => {
  it('writes a thread-scoped canonical assistant selection without claiming range parity', () => {
    const source = readFileSync(
      new URL('./Transcript.tsx', import.meta.url),
      'utf8'
    );
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('createAssistantSelectionAttachment({');
    expect(source).toContain('assistantMessageId: message.id');
    expect(source).toContain('addAssistantSelection(threadId, selection)');
    expect(source).toContain('getAssistantSelectionValidationError({');
    expect(source).toContain(
      'draftAttachmentCount >= PROVIDER_SEND_TURN_MAX_ATTACHMENTS'
    );
    expect(source).toContain('disabled: assistantSelectionUnavailable');
    expect(source).toContain("addToChat.disabled ? ' ui-disabled' : ''");
    expect(source).toContain('Reference whole assistant message');
    expect(source).toContain('Reference whole message');
    expect(source).not.toContain('Reference selection');
    expect(routerSource).toContain('threadId={threadId}');
  });

  it('uses the shared semantic theme tokens for every interaction state', () => {
    const styles = readFileSync(
      new URL('./App.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.TranscriptAssistantAddToChatText\s*\{[^}]*color:\s*var\(--color-text-foreground-tertiary\);/s
    );
    expect(styles).toMatch(
      /\.TranscriptAssistantAddToChat\.ui-hover\s*\{[^}]*background-color:\s*var\(--color-background-button-tertiary-hover\);/s
    );
    expect(styles).toMatch(
      /\.TranscriptAssistantAddToChat\.ui-focus\s*\{[^}]*box-shadow:\s*0 0 0 1px var\(--color-border-focus\);/s
    );
    expect(styles).toMatch(
      /\.TranscriptAssistantAddToChat\.ui-pressed\s*\{[^}]*background-color:\s*var\(--color-background-button-tertiary-active\);/s
    );
    expect(styles).not.toMatch(
      /\.SliceRoot--theme-(?:light|dark)\s+\.TranscriptAssistantAddToChat/
    );
  });
});
