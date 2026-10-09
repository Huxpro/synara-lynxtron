import type {
  ClientOrchestrationCommand,
  ModelSelection,
  NativeApi,
  ProviderKind,
} from "@synara/contracts";

import type { LynxAppSnapCapture } from "../platform/appSnap";
import type { loadLandingBootstrap } from "../components/composer/LandingComposer.lynx";
import { ensureNativeApi } from "~/nativeApi";
import { defaultModelSelectionForProvider } from "../lib/defaultModelSelection";

type LandingBootstrap = Awaited<ReturnType<typeof loadLandingBootstrap>>;

function appSnapId(kind: "command" | "thread"): string {
  "background only";
  return `lynx-appsnap-${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface AppSnapDraftImage {
  readonly appSnapCaptureId?: string;
}

export interface AppSnapDraft {
  readonly images: ReadonlyArray<AppSnapDraftImage>;
}

export function findAppSnapCaptureThreadId(
  draftsByThreadId: Readonly<Record<string, AppSnapDraft>>,
  captureId: string,
): string | null {
  for (const [threadId, draft] of Object.entries(draftsByThreadId)) {
    if (draft.images.some((image) => image.appSnapCaptureId === captureId)) {
      return threadId;
    }
  }
  return null;
}

export function appSnapCaptureTimestampMs(
  capture: Pick<LynxAppSnapCapture, "capturedAt">,
  fallbackMs: number,
): number {
  const timestampMs = Date.parse(capture.capturedAt);
  return Number.isFinite(timestampMs) ? timestampMs : fallbackMs;
}

export function buildFreshAppSnapThreadCreateCommand(input: {
  readonly bootstrap: LandingBootstrap;
  readonly commandId: string;
  readonly createdAt: string;
  readonly defaultProvider: ProviderKind;
  readonly threadId: string;
}): Extract<ClientOrchestrationCommand, { type: "thread.create" }> {
  const modelSelection: ModelSelection =
    input.bootstrap.homeProject.defaultModelSelection ??
    defaultModelSelectionForProvider(input.defaultProvider);
  return {
    type: "thread.create",
    commandId: input.commandId as never,
    threadId: input.threadId as never,
    projectId: input.bootstrap.homeProject.id,
    title: "New chat",
    modelSelection,
    runtimeMode: "full-access",
    interactionMode: "default",
    envMode: input.bootstrap.generalSettings.defaultThreadEnvMode,
    branch: null,
    worktreePath: null,
    createdAt: input.createdAt as never,
  };
}

export async function createFreshAppSnapTask(input: {
  readonly defaultProvider: ProviderKind;
  readonly loadBootstrap: typeof loadLandingBootstrap;
  readonly dispatchCommand?: NativeApi["orchestration"]["dispatchCommand"];
  readonly fetchSnapshot?: NativeApi["orchestration"]["getShellSnapshot"];
  readonly createCommandId?: () => string;
  readonly createThreadId?: () => string;
  readonly now?: () => Date;
}): Promise<string> {
  "background only";
  const dispatchCommand = input.dispatchCommand ?? ensureNativeApi().orchestration.dispatchCommand;
  const fetchSnapshot = input.fetchSnapshot ?? ensureNativeApi().orchestration.getShellSnapshot;
  const threadId = (input.createThreadId ?? (() => appSnapId("thread")))();
  const bootstrap = await input.loadBootstrap(input.defaultProvider, "chat");
  const command = buildFreshAppSnapThreadCreateCommand({
    bootstrap,
    commandId: (input.createCommandId ?? (() => appSnapId("command")))(),
    createdAt: (input.now ?? (() => new Date()))().toISOString(),
    defaultProvider: input.defaultProvider,
    threadId,
  });
  try {
    await dispatchCommand(command);
  } catch (error) {
    const recovered = (await fetchSnapshot()).threads.some((thread) => thread.id === threadId);
    if (!recovered) throw error;
  }
  return threadId;
}
