import { describe, expect, it } from "vitest";

import {
  appendVoiceTranscriptToPrompt,
  deriveComposerVoiceState,
  describeVoiceRecordingStartError,
  isVoiceRecorderActionArmed,
  resolveVoiceTranscriptionFailure,
  resolveVoiceRecordingStartGuard,
  sanitizeVoiceErrorMessage,
} from "./composerVoice";

describe("composer voice policy", () => {
  it("appends non-empty transcripts without preserving trailing prompt space", () => {
    expect(appendVoiceTranscriptToPrompt("Hello   ", "  world  ")).toBe("Hello\nworld");
    expect(appendVoiceTranscriptToPrompt("Hello", "   ")).toBeNull();
  });

  it("extracts the actionable nested RPC error", () => {
    expect(
      sanitizeVoiceErrorMessage(
        'Synara RPC server.transcribeVoice failed: [{"error":{"message":"Provider failed","cause":{"message":"Outbound request failed."}}}]',
      ),
    ).toBe("Outbound request failed.");
  });

  it("resolves expired auth to shared recovery copy and action", () => {
    expect(
      resolveVoiceTranscriptionFailure(new Error("Your ChatGPT login has expired. Sign in again.")),
    ).toEqual({
      authExpired: true,
      title: "Sign in to ChatGPT again",
      description:
        "Voice transcription uses your ChatGPT session in Codex. That session was rejected, so sign in again there and retry.",
      actionLabel: "Refresh status",
    });
  });

  it("keeps ordinary failures actionable without an auth action", () => {
    expect(
      resolveVoiceTranscriptionFailure(new Error("network unavailable"), {
        transcriptionFailedTitle: "Couldn't transcribe voice note",
      }),
    ).toEqual({
      authExpired: false,
      title: "Couldn't transcribe voice note",
      description: "network unavailable",
      actionLabel: null,
    });
  });

  it("maps native microphone permission failures to the shared guidance", () => {
    const error = new Error("Permission denied");
    error.name = "NotAllowedError";
    expect(describeVoiceRecordingStartError(error)).toContain(
      "macOS Privacy & Security > Microphone",
    );
  });

  it("keeps an active recorder visible after provider availability changes", () => {
    expect(
      deriveComposerVoiceState({
        authStatus: "unauthenticated",
        voiceTranscriptionAvailable: false,
        isRecording: true,
        isTranscribing: false,
      }),
    ).toEqual({
      canRenderVoiceNotes: false,
      canStartVoiceNotes: false,
      showVoiceNotesControl: true,
    });
  });

  it("arms recorder actions only after the shared debounce window", () => {
    expect(isVoiceRecorderActionArmed({ nowMs: 1_249, startedAtMs: 1_000 })).toBe(false);
    expect(isVoiceRecorderActionArmed({ nowMs: 1_250, startedAtMs: 1_000 })).toBe(true);
    expect(isVoiceRecorderActionArmed({ nowMs: 900, startedAtMs: 1_000 })).toBe(true);
  });

  it("uses one ordered start guard for both renderers", () => {
    const base = {
      authStatus: "authenticated" as const,
      canStartVoiceNotes: true,
      hasWorkspace: true,
      isRecording: false,
      isTranscribing: false,
      pendingUserInputCount: 0,
    };
    expect(resolveVoiceRecordingStartGuard(base)).toEqual({ kind: "allow" });
    expect(resolveVoiceRecordingStartGuard({ ...base, hasWorkspace: false })).toEqual({
      kind: "ignore",
    });
    expect(
      resolveVoiceRecordingStartGuard({
        ...base,
        authStatus: "unauthenticated",
      }),
    ).toEqual({
      kind: "notify",
      title: "Sign in to ChatGPT in Codex before using voice notes.",
    });
    expect(
      resolveVoiceRecordingStartGuard({
        ...base,
        canStartVoiceNotes: false,
      }),
    ).toEqual({
      kind: "notify",
      title: "Voice notes require a ChatGPT-authenticated Codex session.",
    });
    expect(resolveVoiceRecordingStartGuard({ ...base, pendingUserInputCount: 1 })).toEqual({
      kind: "notify",
      title: "Answer plan questions before recording a voice note.",
    });
  });
});
