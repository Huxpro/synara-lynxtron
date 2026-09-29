import type { ServerVoiceTranscriptionInput } from "@synara/contracts";
import { bridgeCall } from "./bridge";

export interface NativeVoiceState {
  readonly supported: boolean;
  readonly recording: boolean;
  readonly permission: "granted" | "denied" | "restricted" | "not-determined" | "unknown";
  readonly level?: number;
}

export type NativeVoicePayload = Pick<
  ServerVoiceTranscriptionInput,
  "audioBase64" | "durationMs" | "mimeType" | "sampleRateHz"
>;

export const nativeVoiceRecorder = {
  getState: () => bridgeCall<NativeVoiceState | null>("voiceGetState"),
  start: () => bridgeCall<NativeVoiceState | null>("voiceStartRecording"),
  stop: () => bridgeCall<NativeVoicePayload | null>("voiceStopRecording"),
  cancel: () => bridgeCall<{ readonly ok: boolean }>("voiceCancelRecording"),
};
