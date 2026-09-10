import path from 'node:path';
import { createRequire } from 'node:module';

import { SERVER_VOICE_TRANSCRIPTION_MAX_AUDIO_BYTES } from '@synara/contracts';

export type VoicePermission = 'granted' | 'denied' | 'restricted' | 'not-determined' | 'unknown';

export interface NativeVoiceRecorderState {
  readonly supported: boolean;
  readonly recording: boolean;
  readonly permission: VoicePermission;
  readonly level?: number;
}

export interface NativeVoiceRecordingPayload {
  readonly audioBase64: string;
  readonly durationMs: number;
  readonly mimeType: 'audio/wav';
  readonly sampleRateHz: 24000;
}

interface NativeVoiceRecorderAddon {
  getState(): NativeVoiceRecorderState;
  requestPermission(callback: (granted: boolean) => void): void;
  start(maxOutputBytes: number): void;
  stop(): { readonly wav: Buffer; readonly durationMs: number } | undefined;
  cancel(): void;
}

export interface NativeVoiceRecorder {
  getState(): NativeVoiceRecorderState;
  start(): Promise<NativeVoiceRecorderState>;
  stop(): NativeVoiceRecordingPayload | null;
  cancel(): void;
  dispose(): void;
}

const UNSUPPORTED_STATE: NativeVoiceRecorderState = {
  supported: false, recording: false, permission: 'unknown',
  level: 0,
};

export function createNativeVoiceRecorder(input: {
  readonly platform?: NodeJS.Platform;
  readonly requireNative?: (path: string) => NativeVoiceRecorderAddon;
} = {}): NativeVoiceRecorder {
  if ((input.platform ?? process.platform) !== 'darwin') {
    return {
      getState: () => UNSUPPORTED_STATE,
      start: async () => UNSUPPORTED_STATE,
      stop: () => null,
      cancel() {},
      dispose() {},
    };
  }
  const requireNative = input.requireNative ?? createRequire(import.meta.url);
  let native: NativeVoiceRecorderAddon | null = null;
  const load = () =>
    (native ??= requireNative(path.join(__dirname, 'native', 'voice-recorder.node')));
  return {
    getState: () => load().getState(),
    async start() {
      const addon = load();
      let state = addon.getState();
      if (state.permission === 'not-determined') {
        await new Promise<boolean>((resolve) => addon.requestPermission(resolve));
        state = addon.getState();
      }
      if (state.permission !== 'granted') {
        throw new Error('Microphone access was denied.');
      }
      addon.start(SERVER_VOICE_TRANSCRIPTION_MAX_AUDIO_BYTES);
      return addon.getState();
    },
    stop() {
      const result = load().stop();
      if (!result?.wav.length) return null;
      return {
        audioBase64: result.wav.toString('base64'),
        durationMs: Math.max(1, Math.round(result.durationMs)),
        mimeType: 'audio/wav',
        sampleRateHz: 24000,
      };
    },
    cancel: () => native?.cancel(),
    dispose() { native?.cancel(); native = null; },
  };
}
