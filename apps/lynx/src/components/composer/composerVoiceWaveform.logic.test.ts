import { describe, expect, it } from '@rstest/core';

import {
  scaleNativeVoiceWaveformLevel,
  voiceWaveformBarHeight,
} from './composerVoiceWaveform.logic';

describe('native voice waveform display scale', () => {
  it('keeps silence quiet while expanding speech-range differences', () => {
    expect(scaleNativeVoiceWaveformLevel(0)).toBe(0.04);
    expect(scaleNativeVoiceWaveformLevel(0.02)).toBeGreaterThan(0.04);
    expect(scaleNativeVoiceWaveformLevel(0.05)).toBeGreaterThan(
      scaleNativeVoiceWaveformLevel(0.02),
    );
    expect(scaleNativeVoiceWaveformLevel(0.12)).toBeGreaterThan(
      scaleNativeVoiceWaveformLevel(0.05),
    );
    expect(scaleNativeVoiceWaveformLevel(0.32)).toBe(1);
  });

  it('renders normalized levels with the Electron 3–22px formula', () => {
    expect(voiceWaveformBarHeight(0)).toBe(4);
    expect(voiceWaveformBarHeight(0.06)).toBe(4);
    expect(voiceWaveformBarHeight(0.12)).toBe(5);
    expect(voiceWaveformBarHeight(0.48)).toBe(12);
    expect(voiceWaveformBarHeight(1)).toBe(22);
    expect(scaleNativeVoiceWaveformLevel(Number.NaN)).toBe(0.04);
    expect(voiceWaveformBarHeight(Number.NaN)).toBe(4);
    expect(voiceWaveformBarHeight(-1)).toBe(4);
    expect(voiceWaveformBarHeight(2)).toBe(22);
  });
});
