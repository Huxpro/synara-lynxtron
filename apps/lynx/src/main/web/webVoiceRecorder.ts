// Lynx-for-Web host: voice recording with the browser's microphone.
//
// Answers the same four bridge calls as the desktop host's recorder
// (src/main/desktop/voiceRecorder.ts), so the shared composer shows and drives its voice
// button here as it does there. Encoding and state rules are in the logic module.
import { SERVER_VOICE_TRANSCRIPTION_MAX_AUDIO_BYTES } from "@synara/contracts";

import {
  bytesToBase64,
  encodeWavPcm16,
  peakLevel,
  WEB_VOICE_SAMPLE_RATE_HZ,
  webVoicePermission,
  webVoiceSupported,
  type WebVoicePermission,
  type WebVoiceState,
} from "./webVoiceRecorder.logic";

export interface WebVoicePayload {
  readonly audioBase64: string;
  readonly durationMs: number;
  readonly mimeType: "audio/wav";
  readonly sampleRateHz: typeof WEB_VOICE_SAMPLE_RATE_HZ;
}

interface ActiveRecording {
  readonly stream: MediaStream;
  readonly context: AudioContext;
  readonly processor: ScriptProcessorNode;
  readonly blocks: Float32Array[];
  readonly startedAt: number;
}

export function createWebVoiceRecorder() {
  let active: ActiveRecording | null = null;
  let level = 0;
  let permission: WebVoicePermission = "unknown";

  const supported = () =>
    webVoiceSupported({
      isSecureContext: globalThis.isSecureContext === true,
      hasGetUserMedia: typeof globalThis.navigator?.mediaDevices?.getUserMedia === "function",
      hasAudioContext: typeof globalThis.AudioContext === "function",
    });

  const refreshPermission = async () => {
    try {
      const status = await globalThis.navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      permission = webVoicePermission(status.state);
    } catch {
      // Not every browser answers for the microphone; the prompt on start decides then.
    }
  };

  const state = (): WebVoiceState => ({
    supported: supported(),
    recording: active !== null,
    permission,
    level: active ? level : 0,
  });

  const release = () => {
    const recording = active;
    active = null;
    level = 0;
    if (!recording) return null;
    recording.processor.disconnect();
    recording.processor.onaudioprocess = null;
    for (const track of recording.stream.getTracks()) track.stop();
    void recording.context.close().catch(() => undefined);
    return recording;
  };

  return {
    async getState(): Promise<WebVoiceState> {
      if (supported() && !active) await refreshPermission();
      return state();
    },
    async start(): Promise<WebVoiceState> {
      if (!supported()) return state();
      release();
      let stream: MediaStream;
      try {
        stream = await globalThis.navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
        });
      } catch {
        permission = "denied";
        throw new Error("Microphone access was denied.");
      }
      permission = "granted";
      // The context resamples the microphone to the rate the server expects.
      const context = new AudioContext({ sampleRate: WEB_VOICE_SAMPLE_RATE_HZ });
      const source = context.createMediaStreamSource(stream);
      // ScriptProcessorNode is deprecated in favour of AudioWorklet, which needs a
      // separately served module; for a short mono capture this stays in one file.
      const processor = context.createScriptProcessor(4096, 1, 1);
      const blocks: Float32Array[] = [];
      processor.onaudioprocess = (event) => {
        const samples = new Float32Array(event.inputBuffer.getChannelData(0));
        blocks.push(samples);
        level = peakLevel(samples);
      };
      source.connect(processor);
      // A processor only runs while connected to a destination; its output stays silent.
      processor.connect(context.destination);
      active = { stream, context, processor, blocks, startedAt: Date.now() };
      return state();
    },
    stop(): WebVoicePayload | null {
      const recording = release();
      if (!recording || recording.blocks.length === 0) return null;
      const wav = encodeWavPcm16(
        recording.blocks,
        WEB_VOICE_SAMPLE_RATE_HZ,
        SERVER_VOICE_TRANSCRIPTION_MAX_AUDIO_BYTES,
      );
      return {
        audioBase64: bytesToBase64(wav, (binary) => globalThis.btoa(binary)),
        durationMs: Math.max(1, Date.now() - recording.startedAt),
        mimeType: "audio/wav",
        sampleRateHz: WEB_VOICE_SAMPLE_RATE_HZ,
      };
    },
    cancel(): { readonly ok: boolean } {
      release();
      return { ok: true };
    },
  };
}
