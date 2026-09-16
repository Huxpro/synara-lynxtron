import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { ComposerVoiceButton } from './ComposerVoiceControls.lynx';

describe('Native composer voice controls', () => {
  it('embeds semantic secondary paint in the generated microphone SVG', () => {
    render(<ComposerVoiceButton disabled={false} onActivate={() => {}} />);

    expect(
      elementTree.root
        ?.querySelector('.ComposerVoiceIconLynx')
        ?.getAttribute('content')
    ).toContain('stroke="rgba(13, 13, 13, 0.598)"');
  });

  it('matches source action anatomy and exposes recording controls', () => {
    const source = readFileSync(new URL('./ComposerVoiceControls.lynx.tsx', import.meta.url), 'utf8');
    const styles = readFileSync(new URL('./composer.css', import.meta.url), 'utf8');
    expect(source).toContain('COMPOSER_VOICE_LABELS.record');
    expect(source).toContain('COMPOSER_VOICE_LABELS.stopAndTranscribe');
    expect(source).toContain('COMPOSER_VOICE_LABELS.send');
    expect(source).toContain('ComposerVoiceIconLynx');
    expect(source).toContain('props.waveformLevels.slice(-WAVEFORM_MAX_SAMPLES)');
    expect(source).toContain('voiceWaveformBarHeight(level)');
    expect(source).toContain('ComposerVoiceWaveformBaselineLynx');
    expect(source).toContain('ComposerVoiceStopGlyphLynx--secondary');
    expect(source).toContain('ComposerVoiceSubmitIconLynx');
    expect(source).toContain('ComposerVoiceSpinnerLynx--secondary');
    expect(styles).toMatch(/\.ComposerVoiceButtonLynx,[\s\S]*?width:\s*28px;[\s\S]*?height:\s*28px;/);
    expect(styles).toMatch(/\.ComposerVoiceIconLynx\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;/s);
    expect(styles).toMatch(/\.ComposerVoiceDurationLynx\s*\{[^}]*width:\s*38px;[^}]*flex-shrink:\s*0;/s);
    expect(styles).toMatch(/\.ComposerVoiceWaveformBaselineLynx\s*\{[^}]*top:\s*14px;[^}]*border-top-width:\s*1px;[^}]*border-top-style:\s*dashed;[^}]*border-top-color:\s*var\(--border\);/s);
    expect(styles).toMatch(/\.ComposerVoiceCancelLynx\s*\{[^}]*border-radius:\s*14px;/s);
  });
});
