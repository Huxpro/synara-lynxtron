import type { ServerProviderAuthStatus } from "@synara/contracts";

export const DEFAULT_VOICE_TRANSCRIPTION_FAILURE_TITLE = "Voice transcription failed";
export const DEFAULT_VOICE_TRANSCRIPTION_FAILURE_DESCRIPTION =
  "The voice note could not be transcribed.";
export const VOICE_AUTH_EXPIRED_TITLE = "Sign in to ChatGPT again";
export const VOICE_AUTH_EXPIRED_DESCRIPTION =
  "Voice transcription uses your ChatGPT session in Codex. That session was rejected, so sign in again there and retry.";
export const VOICE_REFRESH_ACTION_LABEL = "Refresh status";
export const VOICE_RECORDER_ACTION_ARM_DELAY_MS = 250;
export const VOICE_SIGN_IN_REQUIRED_TITLE = "Sign in to ChatGPT in Codex before using voice notes.";
export const VOICE_UNAVAILABLE_TITLE = "Voice notes require a ChatGPT-authenticated Codex session.";
export const VOICE_PENDING_INPUT_TITLE = "Answer plan questions before recording a voice note.";

export type VoiceRecordingStartGuard =
  | { readonly kind: "allow" }
  | { readonly kind: "ignore" }
  | { readonly kind: "notify"; readonly title: string };

export function resolveVoiceRecordingStartGuard(input: {
  readonly authStatus: ServerProviderAuthStatus | null | undefined;
  readonly canStartVoiceNotes: boolean;
  readonly hasWorkspace: boolean;
  readonly isRecording: boolean;
  readonly isTranscribing: boolean;
  readonly pendingUserInputCount: number;
}): VoiceRecordingStartGuard {
  if (!input.hasWorkspace || input.isRecording || input.isTranscribing) {
    return { kind: "ignore" };
  }
  if (input.authStatus === "unauthenticated") {
    return { kind: "notify", title: VOICE_SIGN_IN_REQUIRED_TITLE };
  }
  if (!input.canStartVoiceNotes) {
    return { kind: "notify", title: VOICE_UNAVAILABLE_TITLE };
  }
  if (input.pendingUserInputCount > 0) {
    return { kind: "notify", title: VOICE_PENDING_INPUT_TITLE };
  }
  return { kind: "allow" };
}

export function isVoiceRecorderActionArmed(input: {
  readonly actionArmDelayMs?: number;
  readonly nowMs: number;
  readonly startedAtMs: number | null;
}): boolean {
  const delayMs = input.actionArmDelayMs ?? VOICE_RECORDER_ACTION_ARM_DELAY_MS;
  if (delayMs <= 0 || input.startedAtMs === null) return true;
  const recordedForMs = Math.round(input.nowMs - input.startedAtMs);
  return recordedForMs < 0 || recordedForMs >= delayMs;
}

export function appendVoiceTranscriptToPrompt(
  currentPrompt: string,
  transcript: string,
): string | null {
  const trimmedTranscript = transcript.trim();
  if (trimmedTranscript.length === 0) return null;
  return currentPrompt.trim().length === 0
    ? trimmedTranscript
    : `${currentPrompt.replace(/\s+$/, "")}\n${trimmedTranscript}`;
}

export function sanitizeVoiceErrorMessage(message: string): string {
  const normalized = message.trim();
  if (normalized.length === 0) {
    return DEFAULT_VOICE_TRANSCRIPTION_FAILURE_DESCRIPTION;
  }

  const rpcPayload = normalized.match(/failed:\s*(\[[\s\S]*\]|\{[\s\S]*\})$/)?.[1];
  if (rpcPayload) {
    try {
      const parsed = JSON.parse(rpcPayload) as unknown;
      const messages: string[] = [];
      const visit = (value: unknown) => {
        if (!value || typeof value !== "object") return;
        if ("message" in value && typeof value.message === "string") {
          messages.push(value.message);
        }
        for (const nested of Object.values(value)) visit(nested);
      };
      visit(parsed);
      const mostSpecific = messages.at(-1)?.trim();
      if (mostSpecific) return mostSpecific;
    } catch {
      // Fall through to the plain bridge-error cleanup below.
    }
  }

  const firstLine = normalized.split("\n")[0]?.trim() ?? normalized;
  const withoutRpcPrefix = firstLine.replace(/^Synara RPC [^ ]+ failed:\s*/i, "");
  const withoutInlineStack = withoutRpcPrefix.replace(/\s+at file:\/\/.*$/s, "").trim();
  const withoutRemoteMethodPrefix = withoutInlineStack.replace(
    /^Error invoking remote method ['"][^'"]+['"]:\s*/i,
    "",
  );
  const withoutRepeatedErrorPrefix = withoutRemoteMethodPrefix.replace(/^(Error:\s*)+/i, "").trim();
  const providerAdapterPrefix = "Provider adapter request failed";
  const providerAdapterSeparatorIndex = withoutRepeatedErrorPrefix.lastIndexOf(": ");
  const withoutProviderAdapterPrefix =
    withoutRepeatedErrorPrefix.startsWith(providerAdapterPrefix) &&
    providerAdapterSeparatorIndex >= providerAdapterPrefix.length
      ? withoutRepeatedErrorPrefix.slice(providerAdapterSeparatorIndex + 2).trim()
      : withoutRepeatedErrorPrefix;

  return withoutProviderAdapterPrefix.length > 0
    ? withoutProviderAdapterPrefix
    : DEFAULT_VOICE_TRANSCRIPTION_FAILURE_DESCRIPTION;
}

export function isVoiceAuthExpiredMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes("chatgpt login has expired") || normalized.includes("sign in again");
}

export function describeVoiceRecordingStartError(error: unknown): string {
  if (!(error instanceof Error)) return "The microphone could not be opened.";

  const normalizedMessage = error.message.trim();
  const errorName = typeof error.name === "string" ? error.name : "";
  if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
    return "Microphone access was denied. Enable it in macOS Privacy & Security > Microphone for Synara, then try again.";
  }
  if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
    return "No microphone was found. Connect one and try again.";
  }
  if (errorName === "NotReadableError" || errorName === "TrackStartError") {
    return "The microphone is busy or unavailable right now. Close other audio apps and try again.";
  }
  if (errorName === "SecurityError") {
    return "Microphone access is blocked in this environment.";
  }
  return normalizedMessage.length > 0
    ? sanitizeVoiceErrorMessage(normalizedMessage)
    : "The microphone could not be opened.";
}

export function deriveComposerVoiceState(input: {
  authStatus: ServerProviderAuthStatus | null | undefined;
  voiceTranscriptionAvailable: boolean | undefined;
  isRecording: boolean;
  isTranscribing: boolean;
}) {
  const canRenderVoiceNotes = input.authStatus !== "unauthenticated";
  const canStartVoiceNotes = canRenderVoiceNotes && input.voiceTranscriptionAvailable !== false;
  return {
    canRenderVoiceNotes,
    canStartVoiceNotes,
    showVoiceNotesControl: canRenderVoiceNotes || input.isRecording || input.isTranscribing,
  };
}

export interface VoiceTranscriptionFailureCopy {
  readonly transcriptionFailedTitle?: string;
  readonly fallbackDescription?: string;
  readonly authExpiredTitle?: string;
  readonly authExpiredDescription?: string;
  readonly refreshActionLabel?: string;
}

export function resolveVoiceTranscriptionFailure(
  error: unknown,
  copy: VoiceTranscriptionFailureCopy = {},
) {
  const description =
    error instanceof Error
      ? sanitizeVoiceErrorMessage(error.message)
      : (copy.fallbackDescription ?? DEFAULT_VOICE_TRANSCRIPTION_FAILURE_DESCRIPTION);
  const authExpired = isVoiceAuthExpiredMessage(description);
  return {
    authExpired,
    title: authExpired
      ? (copy.authExpiredTitle ?? VOICE_AUTH_EXPIRED_TITLE)
      : (copy.transcriptionFailedTitle ?? DEFAULT_VOICE_TRANSCRIPTION_FAILURE_TITLE),
    description: authExpired
      ? (copy.authExpiredDescription ?? VOICE_AUTH_EXPIRED_DESCRIPTION)
      : description,
    actionLabel: authExpired ? (copy.refreshActionLabel ?? VOICE_REFRESH_ACTION_LABEL) : null,
  };
}
