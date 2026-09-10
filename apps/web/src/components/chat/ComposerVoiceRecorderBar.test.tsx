import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ComposerVoiceRecorderBar } from './ComposerVoiceRecorderBar';

describe('ComposerVoiceRecorderBar', () => {
  it('names the recording actions after their actual behavior', () => {
    const markup = renderToStaticMarkup(
      <ComposerVoiceRecorderBar
        durationLabel="0:03"
        isRecording
        isTranscribing={false}
        waveformLevels={[0.2, 0.8]}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(markup).toContain('aria-label="Stop and transcribe voice note"');
    expect(markup).toContain('aria-label="Send voice note"');
  });

  it('announces the busy state consistently for both actions', () => {
    const markup = renderToStaticMarkup(
      <ComposerVoiceRecorderBar
        durationLabel="0:03"
        isRecording={false}
        isTranscribing
        waveformLevels={[]}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(markup.match(/aria-label="Transcribing voice note"/g)).toHaveLength(2);
  });
});
