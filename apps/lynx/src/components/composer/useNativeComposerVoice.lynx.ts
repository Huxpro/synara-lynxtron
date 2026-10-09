// Voice notes for a Native prompt field: host support, recording state and
// waveform, and transcription into the draft prompt. Shared by the chat
// composer and the Kanban New task dialog (the web ComposerVoiceController).

import { useEffect, useRef, useState } from "@lynx-js/react";
import type { ProviderKind, ServerProviderStatus } from "@synara/contracts";
import {
  appendVoiceTranscriptToPrompt,
  deriveComposerVoiceState,
  describeVoiceRecordingStartError,
  isVoiceRecorderActionArmed,
  resolveVoiceRecordingStartGuard,
  resolveVoiceTranscriptionFailure,
} from "@synara/shared/composerVoice";

import { useLynxVoiceNotificationStore } from "../../app/voiceNotificationStore.lynx";
import { ensureNativeApi } from "~/nativeApi";
import { nativeVoiceRecorder } from "../../platform/voiceRecorder.lynx";
import { scaleNativeVoiceWaveformLevel } from "./composerVoiceWaveform.logic";

export function useNativeComposerVoice(input: {
  readonly enabled: boolean;
  /** Draft key the transcript is written to; a new key resets the recorder. */
  readonly draftKey: string;
  /** Thread the transcription request is attributed to. */
  readonly threadId: string;
  readonly provider: ProviderKind | undefined;
  readonly providerStatuses: readonly ServerProviderStatus[];
  readonly workspaceRoot: string | null | undefined;
  readonly pendingUserInputCount: number;
  readonly readPrompt: (draftKey: string) => string;
  readonly onTranscript: (draftKey: string, nextPrompt: string) => void;
  /** Called when a voice action starts (e.g. to clear a stale error). */
  readonly onActionStart?: () => void;
  /** Called when recording ends or is cancelled (e.g. to restore focus). */
  readonly onSettled?: () => void;
  readonly onProviderStatusesChange?: (providers: readonly ServerProviderStatus[]) => void;
}) {
  const showVoiceNotification = useLynxVoiceNotificationStore((state) => state.show);
  const [hostSupported, setHostSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [waveformLevels, setWaveformLevels] = useState<readonly number[]>([]);
  const requestIdRef = useRef(0);
  const draftKeyRef = useRef(input.draftKey);
  const providerRef = useRef<ProviderKind | undefined>(input.provider);
  const startedAtRef = useRef<number | null>(null);
  providerRef.current = input.provider;

  const reset = () => {
    requestIdRef.current += 1;
    startedAtRef.current = null;
    setIsRecording(false);
    setIsTranscribing(false);
    setDurationMs(0);
    setWaveformLevels([]);
    void nativeVoiceRecorder.cancel();
  };

  useEffect(() => {
    "background only";
    if (!input.enabled) {
      setHostSupported(false);
      return;
    }
    draftKeyRef.current = input.draftKey;
    reset();
    void nativeVoiceRecorder
      .getState()
      .then((state) => {
        if (draftKeyRef.current === input.draftKey) {
          setHostSupported(state?.supported === true);
        }
      })
      .catch(() => setHostSupported(false));
    return () => {
      requestIdRef.current += 1;
      void nativeVoiceRecorder.cancel();
    };
  }, [input.draftKey, input.enabled]);

  useEffect(() => {
    "background only";
    if (!isRecording || startedAtRef.current === null) return;
    const timer = setInterval(() => {
      const startedAt = startedAtRef.current;
      if (startedAt !== null) setDurationMs(Math.max(0, Date.now() - startedAt));
      void nativeVoiceRecorder
        .getState()
        .then((state) => {
          if (state?.recording) {
            setWaveformLevels((current) =>
              [...current, scaleNativeVoiceWaveformLevel(state.level ?? 0)].slice(-160),
            );
          }
        })
        .catch(() => undefined);
    }, 50);
    return () => clearInterval(timer);
  }, [isRecording]);

  const voiceProviderStatus = input.providerStatuses.find((status) => status.provider === "codex");
  const voiceState = deriveComposerVoiceState({
    // Lynx has no voice-notes setting or per-build gate yet: enabled wherever the host can record.
    enabled: true,
    available: true,
    authStatus: voiceProviderStatus?.authStatus,
    voiceTranscriptionAvailable: voiceProviderStatus?.voiceTranscriptionAvailable,
    isRecording,
    isTranscribing,
  });
  const showVoiceNotesControl = hostSupported && voiceState.showVoiceNotesControl;

  useEffect(() => {
    "background only";
    if (voiceState.canStartVoiceNotes || !isRecording) return;
    reset();
  }, [isRecording, voiceState.canStartVoiceNotes]);

  async function start() {
    "background only";
    const guard = resolveVoiceRecordingStartGuard({
      authStatus: voiceProviderStatus?.authStatus,
      canStartVoiceNotes: voiceState.canStartVoiceNotes,
      hasWorkspace: Boolean(input.workspaceRoot),
      isRecording,
      isTranscribing,
      pendingUserInputCount: input.pendingUserInputCount,
    });
    if (guard.kind === "ignore") return;
    if (guard.kind === "notify") {
      showVoiceNotification({ title: guard.title });
      return;
    }
    input.onActionStart?.();
    try {
      const state = await nativeVoiceRecorder.start();
      if (!state?.recording) throw new Error("The microphone could not be opened.");
      startedAtRef.current = Date.now();
      setDurationMs(0);
      setWaveformLevels([]);
      setIsRecording(true);
    } catch (error) {
      showVoiceNotification({
        title: "Could not start recording",
        description: describeVoiceRecordingStartError(error),
      });
    }
  }

  function isActionArmed() {
    "background only";
    return isVoiceRecorderActionArmed({ nowMs: Date.now(), startedAtMs: startedAtRef.current });
  }

  function cancel() {
    "background only";
    if (!isActionArmed()) return;
    reset();
    input.onSettled?.();
  }

  async function submit() {
    "background only";
    const workspaceRoot = input.workspaceRoot;
    if (!workspaceRoot || !isRecording || isTranscribing) return;
    if (!isActionArmed()) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const requestDraftKey = input.draftKey;
    const requestProvider = input.provider;
    const isCurrentRequest = () =>
      requestIdRef.current === requestId &&
      draftKeyRef.current === requestDraftKey &&
      providerRef.current === requestProvider;
    setIsRecording(false);
    setIsTranscribing(true);
    setDurationMs(0);
    input.onActionStart?.();
    try {
      const payload = await nativeVoiceRecorder.stop();
      if (!payload) {
        showVoiceNotification({ title: "No audio was captured." });
        return;
      }
      const result = await ensureNativeApi().server.transcribeVoice({
        provider: "codex",
        cwd: workspaceRoot,
        threadId: input.threadId as never,
        ...payload,
      });
      if (!isCurrentRequest()) return;
      const nextPrompt = appendVoiceTranscriptToPrompt(
        input.readPrompt(requestDraftKey),
        result.text,
      );
      if (nextPrompt !== null) input.onTranscript(requestDraftKey, nextPrompt);
    } catch (error) {
      if (isCurrentRequest()) {
        const failure = resolveVoiceTranscriptionFailure(error, {
          transcriptionFailedTitle: "Couldn't transcribe voice note",
        });
        const refreshStatuses = () => {
          void ensureNativeApi()
            .server.refreshProviders()
            .then((result) => {
              input.onProviderStatusesChange?.(result.providers);
            });
        };
        if (failure.authExpired) refreshStatuses();
        showVoiceNotification({
          title: failure.title,
          description: failure.description,
          ...(failure.actionLabel
            ? { actionLabel: failure.actionLabel, onAction: refreshStatuses }
            : {}),
        });
      }
    } finally {
      if (isCurrentRequest()) {
        startedAtRef.current = null;
        setDurationMs(0);
        setIsTranscribing(false);
        input.onSettled?.();
      }
    }
  }

  return {
    cancel,
    durationMs,
    isRecording,
    isTranscribing,
    showVoiceNotesControl,
    start,
    submit,
    waveformLevels,
  };
}
