const WAVEFORM_NOISE_FLOOR = 0.015;
const WAVEFORM_FULL_SCALE_LEVEL = 0.32;
const WAVEFORM_MIN_VISIBLE_LEVEL = 0.04;

/**
 * Expands the quiet end of the native microphone's linear RMS signal so its
 * visual response matches the browser recorder without amplifying the audio.
 */
export function scaleNativeVoiceWaveformLevel(level: number): number {
  if (!Number.isFinite(level) || level <= WAVEFORM_NOISE_FLOOR) {
    return WAVEFORM_MIN_VISIBLE_LEVEL;
  }
  const normalized = Math.min(
    1,
    (level - WAVEFORM_NOISE_FLOOR) / (WAVEFORM_FULL_SCALE_LEVEL - WAVEFORM_NOISE_FLOOR),
  );
  return Math.max(WAVEFORM_MIN_VISIBLE_LEVEL, Math.sqrt(normalized));
}

/**
 * Converts an already-normalized display level into the same 3–22px range
 * used by the Electron recorder. Keep microphone-specific gain out of this
 * renderer so fixtures and live data share one visual contract.
 */
export function voiceWaveformBarHeight(level: number): number {
  const normalized = Number.isFinite(level) ? Math.max(0.04, Math.min(1, level)) : 0.04;
  return Math.round(3 + normalized * 19);
}
