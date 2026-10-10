// Lynx-for-Web host: the pure parts of voice recording.
//
// The composer shows its voice button where the host can record (`voiceGetState`). The
// desktop host records through a native addon; this host records with the browser's
// microphone and returns the same payload: 16-bit mono PCM WAV at 24 kHz, base64.

/** The rate the server's transcription input is fixed at (desktop voiceRecorder.ts). */
export const WEB_VOICE_SAMPLE_RATE_HZ = 24000;

export type WebVoicePermission = "granted" | "denied" | "not-determined" | "unknown";

export interface WebVoiceState {
  readonly supported: boolean;
  readonly recording: boolean;
  readonly permission: WebVoicePermission;
  readonly level: number;
}

/** Recording needs a secure context, a microphone API and an audio graph. */
export function webVoiceSupported(environment: {
  readonly isSecureContext: boolean;
  readonly hasGetUserMedia: boolean;
  readonly hasAudioContext: boolean;
}): boolean {
  return environment.isSecureContext && environment.hasGetUserMedia && environment.hasAudioContext;
}

/** The Permissions API's microphone state in the desktop host's vocabulary. */
export function webVoicePermission(state: string | null | undefined): WebVoicePermission {
  if (state === "granted" || state === "denied") return state;
  return state === "prompt" ? "not-determined" : "unknown";
}

/** Loudest sample of a block, 0…1: what the composer's waveform plots. */
export function peakLevel(samples: Float32Array): number {
  let peak = 0;
  for (const sample of samples) {
    const magnitude = Math.abs(sample);
    if (magnitude > peak) peak = magnitude;
  }
  return Math.min(1, peak);
}

/**
 * Mono 16-bit PCM WAV from captured blocks. Stops at `maxBytes`, as the desktop recorder
 * does at the server's audio limit, so a long recording is truncated rather than refused.
 */
export function encodeWavPcm16(
  blocks: readonly Float32Array[],
  sampleRateHz: number,
  maxBytes = Number.POSITIVE_INFINITY,
): Uint8Array {
  const headerBytes = 44;
  const available = blocks.reduce((total, block) => total + block.length, 0);
  const sampleCount = Math.max(0, Math.min(available, Math.floor((maxBytes - headerBytes) / 2)));
  const bytes = new Uint8Array(headerBytes + sampleCount * 2);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRateHz, true);
  view.setUint32(28, sampleRateHz * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  ascii(36, "data");
  view.setUint32(40, sampleCount * 2, true);
  let written = 0;
  for (const block of blocks) {
    for (const sample of block) {
      if (written >= sampleCount) return bytes;
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(
        headerBytes + written * 2,
        Math.round(clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff),
        true,
      );
      written += 1;
    }
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array, encode: (binary: string) => string): string {
  let binary = "";
  // In chunks: a single String.fromCharCode call cannot take a whole recording.
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return encode(binary);
}
