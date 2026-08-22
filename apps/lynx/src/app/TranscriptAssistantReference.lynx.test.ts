import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx assistant message actions', () => {
  it('writes a thread-scoped canonical assistant selection from the hover footer', () => {
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
    expect(source).toContain('TranscriptMessageFooter');
    expect(source).toContain('<MessageCircleIcon');
    expect(source).not.toContain('Reference selection');
    expect(routerSource).toContain('threadId={threadId}');
  });

  it('exposes real pin, copy, and timestamp actions on hover', () => {
    const source = readFileSync(
      new URL('./Transcript.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./App.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain("'thread.pinned-message.add'");
    expect(source).toContain("'thread.pinned-message.remove'");
    expect(source).toContain("import(/* webpackMode: \"eager\" */ '../platform/clipboard')");
    expect(source).toContain('formatShortTimestamp(');
    expect(styles).toMatch(
      /\.TranscriptMessageHoverRegion\.ui-hover \.TranscriptMessageFooter,[\s\S]*?opacity:\s*1;/s
    );
    expect(styles).toMatch(
      /\.TranscriptMessageAction\.ui-hover\s*\{[^}]*background-color:\s*var\(--color-background-button-tertiary-hover\);/s
    );
    expect(styles).toMatch(
      /\.TranscriptMessageAction\.ui-focus\s*\{[^}]*box-shadow:\s*0 0 0 1px var\(--color-border-focus\);/s
    );
    expect(styles).toMatch(
      /\.TranscriptMessageAction\.ui-pressed\s*\{[^}]*background-color:\s*var\(--color-background-button-tertiary-active\);/s
    );
    expect(styles).not.toMatch(
      /\.SliceRoot--theme-(?:light|dark)\s+\.TranscriptMessageAction/
    );
  });
});
