# Native composer voice-input capability audit

Date: 2026-08-31

## Electron source of truth

- `apps/web/src/lib/voiceRecorder.ts` requests an audio-only `MediaStream`, captures mono `Float32Array` chunks through `AudioContext`, emits bounded waveform samples, stops every track, closes the context, linearly resamples to 24 kHz, and encodes a 16-bit mono WAV payload.
- `apps/web/src/components/chat/useComposerVoiceController.ts` owns start, stop, cancel, transcription, stale request identity, thread/provider changes, provider/auth gating, pending-input gating, errors, and cleanup.
- `apps/desktop/src/main.ts` permits only microphone media requests and uses the macOS system permission state/request API.
- The completed WAV is sent through the existing `server.transcribeVoice` contract. A non-empty result is appended to the current draft through `appendVoiceTranscriptToPrompt`; it is not sent as a renderer-specific turn.

## Lynxtron 0.0.16 capability boundary

- The Lynx runtime does not expose browser `navigator.mediaDevices`, `getUserMedia`, `AudioContext`, or `MediaRecorder` to this Native surface.
- LynxBase's closest official documentation describes microphone support as an optional Krypton host integration and links mobile examples; it does not document a Lynxtron Desktop microphone API.
- The installed Lynxtron macOS app contains `NSMicrophoneUsageDescription`, but package declarations/source expose no microphone permission, capture, or audio-data bridge.
- The OnCall search returned no relevant Lynxtron microphone implementation or supported API.

## Implementation boundary

Synara already compiles and loads small macOS N-API addons for exact-window keyboard monitoring and the WKWebView host. The supported path is therefore a bounded macOS host recorder using AVFoundation, surfaced through `-lynx-invoke`, while preserving the existing `server.transcribeVoice` RPC and shared draft-insertion semantics. The renderer must hide the control when the host reports unsupported; Windows/Linux remain unsupported until an equivalent host capture adapter exists.

Required lifecycle: permission query/request, single active recording, start, stop to 24 kHz mono WAV, cancel, byte/duration limits, cleanup on window close, and explicit denied/missing/busy failures.
