// FILE: adapters/wsTransport.lynx.ts
// Purpose: Lynx replacement for the Web `wsTransport.ts` (resolved in its place
//   by lynx.config.ts). Same public surface as the upstream `WsTransport`, but
//   instead of running the Effect RPC client in the renderer it talks to the
//   feature socket the Lynxtron host owns (`main/desktop/nativeRpcHost.ts`,
//   `main/web/web-host.ts`) through `NativeModules.bridge`. Everything above it
//   (`wsNativeApi.ts` → `nativeApi` → store → EventRouter) is upstream source.
// Layer: L1 platform port (lynx implementation of the transport)
//
// Threading: this module is reached by shared Web modules on both Lynx threads,
// so nothing at module scope may touch the host bridge. Host access happens in
// `'background only'` functions only; a transport instance created on the main
// thread never opens a stream and rejects requests.

import {
  COMPUTER_WS_CHANNELS,
  COMPUTER_WS_METHODS,
  DEVICE_WS_CHANNELS,
  DEVICE_WS_METHODS,
  ORCHESTRATION_STREAM_OVERFLOW_CODE,
  ORCHESTRATION_WS_CHANNELS,
  ORCHESTRATION_WS_METHODS,
  TASKS_UNAVAILABLE_ERROR_CODE,
  ThreadId,
  WS_CHANNELS,
  WS_METHODS,
  WS_PROJECT_FILE_WATCH_CAPABILITY,
  WS_GIT_ACTION_RECOVERY_CAPABILITY,
  WS_TURN_DISPATCH_SETTLEMENT_CAPABILITY,
  type ClientOrchestrationCommand,
  type GitActionProgressEvent,
  type GitCreateDetachedWorktreeResult,
  type GitHubProjectProvisionProgressEvent,
  type GitHubProjectProvisionResult,
  type GitRunStackedActionResult,
  type GitWorktreeSetupProgressEvent,
  type OrchestrationSettleTurnDispatchResult,
  type OrchestrationShellStreamItem,
  type ProjectFileChangeEvent,
  type ProjectWatchFileInput,
  type ServerConfigStreamEvent,
  type ServerLifecycleStreamEvent,
  type WsBootstrapNegotiateResult,
  type WsCompatibilityError,
  type WsPush,
  type WsPushChannel,
  type WsPushMessage,
} from "@synara/contracts";

import { useComputerStateStore } from "@synara-web/computerStateStore";
import { useDeviceStateStore } from "@synara-web/deviceStateStore";
import { getUnaryRpcCapacityRetryDelayMs } from "@synara-web/lib/expensiveReadRetry";
import {
  buildThreadSubscribeInput,
  clearThreadDetailResumeCursor,
  resetThreadDetailResumeCursors,
} from "@synara-web/threadDetailResumeCursors";
import { trackWsTurnSettlement, type WsTransportState } from "@synara-web/wsTransportEvents";
import type { RpcTransportState } from "../data/rpcTransport.logic";
import {
  isHostTransportState,
  isNativeTransportError,
  nativeRpcCancelStream,
  nativeRpcOpenStream,
  nativeRpcRequest,
  nativeRpcResetStreams,
  subscribeNativeRpcCompatibility,
  subscribeNativeRpcStreamItems,
  subscribeNativeTerminalEvents,
  subscribeNativeTransportState,
} from "../data/nativeRpcBridge";
import {
  scopedStreamGeneration,
  scopedStreamId,
  type NativeRpcCompatibility,
} from "../main/nativeEventStreams.logic";
import type { RpcFailureDetails } from "../main/rpcFailure.logic";

type PushListener<C extends WsPushChannel> = (message: WsPushMessage<C>) => void;

export interface WsRequestOptions {
  readonly timeoutMs?: number | null;
  readonly signal?: AbortSignal;
}

type WsRequestInterruptionCode =
  | "WS_REQUEST_TIMEOUT"
  | "WS_REQUEST_ABORTED"
  | "WS_REQUEST_RECONNECTED"
  | "WS_TURN_SETTLEMENT_UNAVAILABLE";

/**
 * Same shape as the upstream error so shared callers can keep their checks.
 * `WS_REQUEST_RECONNECTED` is part of the upstream contract (a request cut off
 * by its own runtime being swapped); the host relay has no such state, so this
 * transport never raises it.
 */
export class WsTransportRequestInterruptedError extends Error {
  readonly _tag = "WsTransportRequestInterruptedError";
  readonly code: WsRequestInterruptionCode;
  readonly method: string;
  readonly timeoutMs?: number;
  override readonly cause?: unknown;
  readonly retryable?: boolean;

  constructor(input: {
    readonly message: string;
    readonly code: WsRequestInterruptionCode;
    readonly method: string;
    readonly timeoutMs?: number;
    readonly cause?: unknown;
    readonly retryable?: boolean;
  }) {
    super(input.message);
    this.name = "WsTransportRequestInterruptedError";
    this.code = input.code;
    this.method = input.method;
    if (input.timeoutMs !== undefined) this.timeoutMs = input.timeoutMs;
    if (input.cause !== undefined) this.cause = input.cause;
    if (input.retryable !== undefined) this.retryable = input.retryable;
  }
}

/** Same key as upstream so one file is watched once however many panels show it. */
export function projectFileChangeStreamKey(input: ProjectWatchFileInput): string {
  return `projects.file-change:${input.cwd.length}:${input.cwd}${input.relativePath}`;
}

/** Upstream `threadStreamInputsEqual`: shallow equality of two subscribe inputs. */
export function threadStreamInputsEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  const leftEntries = Object.entries(left);
  if (leftEntries.length !== Object.keys(right).length) return false;
  return leftEntries.every(([key, value]) => (right as Record<string, unknown>)[key] === value);
}

export interface WsThreadStreamFailure {
  readonly threadId: string;
  readonly code: string | null;
  readonly error: Error;
}

export type WsShellStreamFailure = Omit<WsThreadStreamFailure, "threadId">;

// ── stream failure policy ────────────────────────────────────────────────
// Upstream `wsTransport.ts` classifies a failed stream by the typed error in
// its Effect cause. The host relay delivers the same fields on the bridge
// error (`main/rpcFailure.logic.ts`), so the policy below is the upstream one
// (same codes, budgets and delays) restated over plain values.

const STREAM_CAPACITY_ERROR_CODES = new Set([
  "STREAM_CAPACITY_EXCEEDED",
  "THREAD_STREAM_CAPACITY_EXCEEDED",
]);
const STREAM_DUPLICATE_ERROR_CODES = new Set([
  "STREAM_DUPLICATE_SUBSCRIPTION",
  "THREAD_STREAM_DUPLICATE_SUBSCRIPTION",
]);
const THREAD_SNAPSHOT_BOOTSTRAP_ERROR_CODE = "THREAD_SNAPSHOT_NOT_FOUND";
const RESNAPSHOT_REQUIRED_ERROR_CODE = "ORCHESTRATION_RESNAPSHOT_REQUIRED";
const PROJECT_FILE_WATCH_FAILED_ERROR_CODE = "PROJECT_FILE_WATCH_FAILED";
/** A failure of one stream's admission or read model: restarting the socket cannot repair it. */
const STREAM_ADMISSION_ERROR_CODES = new Set([
  ...STREAM_CAPACITY_ERROR_CODES,
  "STREAM_DUPLICATE_SUBSCRIPTION",
  THREAD_SNAPSHOT_BOOTSTRAP_ERROR_CODE,
  "WS_NEGOTIATION_REQUIRED",
  "WS_PROTOCOL_INCOMPATIBLE",
  "WS_CAPABILITIES_INCOMPATIBLE",
  PROJECT_FILE_WATCH_FAILED_ERROR_CODE,
  RESNAPSHOT_REQUIRED_ERROR_CODE,
  "ORCHESTRATION_SNAPSHOT_STALLED",
  "ORCHESTRATION_PROJECTION_STATE_INCOMPLETE",
  // Retried on the overflowing subscription alone, keeping its applied cursor.
  ORCHESTRATION_STREAM_OVERFLOW_CODE,
  // A server that does not offer Tasks refuses the stream for good.
  TASKS_UNAVAILABLE_ERROR_CODE,
]);
/** Faults only the server can clear: keep a slow retry armed instead of dying. */
const SNAPSHOT_FAULT_ERROR_CODES = new Set([
  "ORCHESTRATION_SNAPSHOT_STALLED",
  "ORCHESTRATION_PROJECTION_STATE_INCOMPLETE",
  RESNAPSHOT_REQUIRED_ERROR_CODE,
]);

export const SNAPSHOT_FAULT_RETRY_MS = 30_000;
export const MAX_STREAM_DUPLICATE_RETRY_ATTEMPTS = 5;
export const MAX_THREAD_SNAPSHOT_BOOTSTRAP_RETRY_ATTEMPTS = 12;
export const MAX_RESNAPSHOT_RETRY_ATTEMPTS = 2;
export const MAX_PROJECT_FILE_WATCH_RETRY_ATTEMPTS = 5;
export const MAX_STREAM_OVERFLOW_RETRIES = 8;

/** Upstream's overflow backoff: 250 ms doubling, capped at 16 s. */
export function getStreamOverflowRetryDelayMs(attempt: number): number {
  return Math.min(16_000, 250 * 2 ** Math.min(attempt, 6));
}
const DEFAULT_STREAM_CAPACITY_RETRY_MS = 1_000;
const MAX_STREAM_CAPACITY_RETRY_MS = 10_000;
const DEFAULT_STREAM_DUPLICATE_RETRY_MS = 250;
const DEFAULT_THREAD_SNAPSHOT_BOOTSTRAP_RETRY_MS = 100;
const DEFAULT_RESNAPSHOT_RETRY_MS = 250;
const INITIAL_PROJECT_FILE_WATCH_RETRY_MS = 500;
const MAX_PROJECT_FILE_WATCH_RETRY_MS = 8_000;

export type StreamAdmissionRetryKind = "capacity" | "duplicate" | "thread-bootstrap" | "resnapshot";

export interface StreamAdmissionRetry {
  readonly kind: StreamAdmissionRetryKind;
  readonly attempt: number;
  readonly delayMs: number;
}

export type StreamAdmissionAttempts = Readonly<Record<StreamAdmissionRetryKind, number>>;

function retryAfterOr(failure: RpcFailureDetails, fallbackMs: number): number {
  return failure.retryAfterMs !== null && failure.retryAfterMs > 0
    ? failure.retryAfterMs
    : fallbackMs;
}

/** Upstream `resolveStreamAdmissionRetry`: the in-place retry a rejected stream gets, if any. */
export function resolveStreamAdmissionRetry(
  failure: RpcFailureDetails | null,
  attempts: StreamAdmissionAttempts,
): StreamAdmissionRetry | null {
  const code = failure?.code;
  if (!failure || code == null) return null;
  if (STREAM_CAPACITY_ERROR_CODES.has(code) && failure.retryable !== false) {
    return {
      kind: "capacity",
      attempt: attempts.capacity + 1,
      delayMs: retryAfterOr(failure, DEFAULT_STREAM_CAPACITY_RETRY_MS),
    };
  }
  // Duplicate rejections arrive `retryable: false`, yet a cancel followed by a
  // fast resubscribe races the server-side lease release: retry, bounded.
  if (
    STREAM_DUPLICATE_ERROR_CODES.has(code) &&
    attempts.duplicate < MAX_STREAM_DUPLICATE_RETRY_ATTEMPTS
  ) {
    return {
      kind: "duplicate",
      attempt: attempts.duplicate + 1,
      delayMs: retryAfterOr(failure, DEFAULT_STREAM_DUPLICATE_RETRY_MS),
    };
  }
  if (
    code === THREAD_SNAPSHOT_BOOTSTRAP_ERROR_CODE &&
    attempts["thread-bootstrap"] < MAX_THREAD_SNAPSHOT_BOOTSTRAP_RETRY_ATTEMPTS
  ) {
    return {
      kind: "thread-bootstrap",
      attempt: attempts["thread-bootstrap"] + 1,
      delayMs: retryAfterOr(failure, DEFAULT_THREAD_SNAPSHOT_BOOTSTRAP_RETRY_MS),
    };
  }
  if (
    code === RESNAPSHOT_REQUIRED_ERROR_CODE &&
    failure.retryable !== false &&
    attempts.resnapshot < MAX_RESNAPSHOT_RETRY_ATTEMPTS
  ) {
    return {
      kind: "resnapshot",
      attempt: attempts.resnapshot + 1,
      delayMs: DEFAULT_RESNAPSHOT_RETRY_MS,
    };
  }
  return null;
}

/** Upstream `getProjectFileWatchRetryDelayMs`. */
export function getProjectFileWatchRetryDelayMs(
  failure: RpcFailureDetails | null,
  previousAttempts: number,
): number | null {
  if (previousAttempts >= MAX_PROJECT_FILE_WATCH_RETRY_ATTEMPTS) return null;
  if (failure?.code !== PROJECT_FILE_WATCH_FAILED_ERROR_CODE) return null;
  return Math.min(
    INITIAL_PROJECT_FILE_WATCH_RETRY_MS * 2 ** previousAttempts,
    MAX_PROJECT_FILE_WATCH_RETRY_MS,
  );
}

function failureDetailsOf(error: unknown): RpcFailureDetails | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as {
    readonly code?: unknown;
    readonly retryAfterMs?: unknown;
    readonly retryable?: unknown;
  };
  if (typeof candidate.code !== "string") return null;
  return {
    code: candidate.code,
    retryAfterMs: typeof candidate.retryAfterMs === "number" ? candidate.retryAfterMs : null,
    retryable: typeof candidate.retryable === "boolean" ? candidate.retryable : null,
  };
}

const THREAD_STREAM_KEY_PREFIX = "orchestration.thread:";
const PROJECT_AGENT_STREAM_KEY_PREFIX = "projectAgent.events:";

/** The turn start whose acknowledgement was lost with the socket, if this request is one. */
function uncertainTurnStart(
  method: string,
  payload: unknown,
): Extract<ClientOrchestrationCommand, { type: "thread.turn.start" }> | null {
  if (method !== ORCHESTRATION_WS_METHODS.dispatchCommand) return null;
  const command = payload as ClientOrchestrationCommand | null;
  return command?.type === "thread.turn.start" ? command : null;
}
const SHELL_STREAM_KEY = "orchestration.shell";

function threadIdFromStreamKey(key: string): string | null {
  return key.startsWith(THREAD_STREAM_KEY_PREFIX)
    ? key.slice(THREAD_STREAM_KEY_PREFIX.length)
    : null;
}

/** Upstream `omitNullUserInputAnswers`: the server schema rejects null answers. */
function omitNullUserInputAnswers(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const command = input as { type?: unknown; answers?: unknown };
  if (command.type !== "thread.user-input.respond" || !command.answers) return input;
  if (typeof command.answers !== "object") return input;
  return {
    ...command,
    answers: Object.fromEntries(
      Object.entries(command.answers).filter(
        ([, answer]) => answer !== null && answer !== undefined,
      ),
    ),
  };
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

interface ProjectFileChangeSubscription {
  readonly input: ProjectWatchFileInput;
  readonly listeners: Set<(event: ProjectFileChangeEvent) => void>;
}

interface ActiveStream {
  /** Minted once the host links (and so the renderer generation) are known. */
  streamId: string | null;
  /** Resolves with whether the open request reached the host bridge. */
  readonly opened: Promise<boolean>;
  readonly settled: Promise<void>;
  stopped: boolean;
}

const STREAM_RESTART_DELAY_MS = 500;
const STREAM_RESTART_MAX_DELAY_MS = 5_000;
/** Upstream: a stream that lived this long resets its file-watch retry budget. */
const STABLE_STREAM_LIFETIME_MS = 10_000;
/** Upstream default request watchdog (`wsTransport.ts` REQUEST_TIMEOUT_MS). */
const REQUEST_TIMEOUT_MS = 60_000;

interface RequestAbortScope {
  /** Settles like `promise`, or rejects with the interruption error first. */
  readonly race: <T>(promise: Promise<T>) => Promise<T>;
  readonly interrupted: () => WsTransportRequestInterruptedError | null;
  readonly cleanup: () => void;
  /** What the host should apply: `null` no watchdog, a number, or the host default. */
  readonly hostTimeoutMs: number | null | undefined;
}

/**
 * Upstream `makeRequestAbortScope` semantics at the compat boundary: validate
 * `timeoutMs`, apply the default deadline, honor an external `AbortSignal`,
 * and reject with the upstream interruption error. Built on a plain promise
 * so it does not need `AbortController` on PrimJS. The host also receives the
 * numeric deadline; cancelling the host-side request itself is a follow-up.
 */
export function makeRequestAbortScope(
  method: string,
  options?: WsRequestOptions,
): RequestAbortScope {
  const timeoutMs = options?.timeoutMs;
  if (timeoutMs !== undefined && timeoutMs !== null) {
    if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
      throw new RangeError("WebSocket RPC timeoutMs must be a finite non-negative number or null.");
    }
  }
  const effectiveTimeoutMs = timeoutMs === undefined ? REQUEST_TIMEOUT_MS : timeoutMs;
  const signal = options?.signal;
  let interruption: WsTransportRequestInterruptedError | null = null;
  let rejectInterrupted: (error: WsTransportRequestInterruptedError) => void = () => undefined;
  const interrupted = new Promise<never>((_resolve, reject) => {
    rejectInterrupted = reject;
  });
  interrupted.catch(() => undefined);
  const interrupt = (error: WsTransportRequestInterruptedError) => {
    if (interruption) return;
    interruption = error;
    rejectInterrupted(error);
  };
  const onAbort = () =>
    interrupt(
      new WsTransportRequestInterruptedError({
        message: `WebSocket RPC ${method} was cancelled.`,
        code: "WS_REQUEST_ABORTED",
        method,
        cause: signal?.reason,
      }),
    );
  if (signal?.aborted) {
    onAbort();
  } else {
    signal?.addEventListener("abort", onAbort, { once: true });
  }
  const timer =
    effectiveTimeoutMs === null
      ? null
      : setTimeout(() => {
          interrupt(
            new WsTransportRequestInterruptedError({
              message: `WebSocket RPC ${method} timed out after ${effectiveTimeoutMs}ms.`,
              code: "WS_REQUEST_TIMEOUT",
              method,
              timeoutMs: effectiveTimeoutMs,
            }),
          );
        }, effectiveTimeoutMs);
  return {
    race: (promise) => Promise.race([promise, interrupted]),
    interrupted: () => interruption,
    cleanup: () => {
      if (timer !== null) clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    },
    hostTimeoutMs: timeoutMs,
  };
}

function deferred<T>(): { readonly promise: Promise<T>; readonly resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function isMainThread(): boolean {
  // Rspeedy defines `__MAIN_THREAD__` per bundle; the typeof guard keeps the
  // module usable under Rstest, where the flag may not be injected.
  return typeof __MAIN_THREAD__ === "undefined" ? false : __MAIN_THREAD__;
}

/** Host relay state (`RpcTransportState`) → the Web transport state contract. */
export function mapHostTransportState(
  state: RpcTransportState,
  everConnected: boolean,
): WsTransportState {
  switch (state) {
    case "connected":
      return "open";
    case "connecting":
    case "reconnecting":
      return "connecting";
    case "offline":
      return "closed";
    case "idle":
      return everConnected ? "closed" : "connecting";
  }
}

let nextStreamSequence = 0;

export class WsTransport {
  /** Renderer generation granted by the host reset handshake (`ensureHostLinks`). */
  private generation: number | null = null;
  private readonly listeners = new Map<string, Set<(message: WsPush) => void>>();
  private readonly stateListeners = new Set<(state: WsTransportState) => void>();
  private readonly compatibilityListeners = new Set<(issue: WsCompatibilityError | null) => void>();
  private readonly latestPushByChannel = new Map<string, WsPush>();
  private readonly streams = new Map<string, ActiveStream>();
  private readonly streamItemHandlers = new Map<string, (item: unknown) => void>();
  private readonly streamRestartTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly streamFailures = new Map<string, number>();
  private readonly streamAdmissionRetries = new Map<
    string,
    Record<StreamAdmissionRetryKind, number>
  >();
  private readonly projectFileWatchRetries = new Map<string, number>();
  private readonly streamOverflowRetries = new Map<string, number>();
  private readonly shellStreamFailureListeners = new Set<(failure: WsShellStreamFailure) => void>();
  private readonly projectAgentSubscriptions = new Map<string, unknown>();
  private readonly threadSubscriptions = new Map<string, unknown>();
  /** The input each running thread stream was opened with (upstream `activeThreadStreamInputs`). */
  private readonly activeThreadStreamInputs = new Map<string, unknown>();
  private readonly projectFileSubscriptions = new Map<string, ProjectFileChangeSubscription>();
  private readonly threadStreamFailureListeners = new Set<
    (failure: WsThreadStreamFailure) => void
  >();
  private readonly compatibilityResultListeners = new Set<
    (compatibility: WsBootstrapNegotiateResult | null) => void
  >();
  private compatibility: WsBootstrapNegotiateResult | null = null;
  /** Survives reconnects so a changed server instance is always noticed. */
  private lastServerInstanceId: string | null = null;
  private shellSubscribed = false;
  /**
   * Whether the running shell stream already delivered its snapshot. An
   * explicit `subscribeShell` while true restarts the stream (the caller reset
   * its fence and waits for a new snapshot); while false the pending snapshot
   * serves the caller, so the call is absorbed.
   */
  private shellSnapshotDelivered = false;
  private legacyTerminalEvents: Promise<() => void> | null = null;
  private sequence = 0;
  private state: WsTransportState = "connecting";
  private everConnected = false;
  private disposed = false;
  private hostLinks: Promise<() => void> | null = null;

  // No constructor argument: the upstream class accepts an explicit socket URL,
  // but here the host owns the endpoint (`runtimeWsUrl` init data), and a
  // renderer-chosen URL would let it address a different backend than its host.

  async request<T = unknown>(
    method: string,
    params?: unknown,
    options?: WsRequestOptions,
  ): Promise<T> {
    if (this.disposed) throw new Error("Transport disposed");
    const scope = makeRequestAbortScope(method, options);
    try {
      await scope.race(this.ensureHostLinks());
      if (method === ORCHESTRATION_WS_METHODS.unsubscribeShell) {
        this.shellSubscribed = false;
        await scope.race(this.stopStream(SHELL_STREAM_KEY));
        return undefined as T;
      }
      if (method === ORCHESTRATION_WS_METHODS.unsubscribeThread) {
        const threadId = (params as { threadId: string }).threadId;
        this.threadSubscriptions.delete(threadId);
        await scope.race(this.stopStream(`orchestration.thread:${threadId}`));
        return undefined as T;
      }
      if (method === ORCHESTRATION_WS_METHODS.subscribeShell) {
        const wasSubscribed = this.shellSubscribed;
        this.shellSubscribed = true;
        this.resetStreamRetries(SHELL_STREAM_KEY);
        await scope.race(this.startShellStream(wasSubscribed && this.shellSnapshotDelivered));
        return undefined as T;
      }
      if (method === ORCHESTRATION_WS_METHODS.subscribeThread) {
        const threadId = (params as { threadId: string }).threadId;
        this.resetStreamRetries(`${THREAD_STREAM_KEY_PREFIX}${threadId}`);
        // Keep the stored input identity across an equal explicit refresh so a
        // stale restart callback cannot supersede the stream requested here.
        const existingInput = this.threadSubscriptions.get(threadId);
        const wasSubscribed = existingInput !== undefined;
        const input = threadStreamInputsEqual(existingInput, params) ? existingInput : params;
        this.threadSubscriptions.set(threadId, input);
        await scope.race(this.startThreadStream(threadId, input, { forceRestart: wasSubscribed }));
        return undefined as T;
      }
      if (method === WS_METHODS.subscribeProjectAgentEvents) {
        const projectId = (params as { projectId: string }).projectId;
        this.resetStreamRetries(`${PROJECT_AGENT_STREAM_KEY_PREFIX}${projectId}`);
        this.projectAgentSubscriptions.set(projectId, params);
        this.startProjectAgentEventStream(projectId, params);
        return undefined as T;
      }
      if (
        method === ORCHESTRATION_WS_METHODS.settleTurnDispatch &&
        !this.compatibility?.capabilities.includes(WS_TURN_DISPATCH_SETTLEMENT_CAPABILITY)
      ) {
        throw new WsTransportRequestInterruptedError({
          message:
            "This server cannot check message delivery. Reconnect to an updated server and check the conversation before sending again.",
          code: "WS_TURN_SETTLEMENT_UNAVAILABLE",
          method,
          retryable: false,
        });
      }
      if (method === WS_METHODS.gitRunStackedAction) {
        return (await this.runRecoverableGitAction(params, scope)) as T;
      }
      if (method === WS_METHODS.gitCreateDetachedWorktree) {
        return (await this.runProgressStream<
          GitWorktreeSetupProgressEvent,
          GitCreateDetachedWorktreeResult
        >(
          method,
          params,
          scope,
          (event) => {
            this.emit(WS_CHANNELS.gitWorktreeSetupProgress, event);
            return event.kind === "completed" ? event.result : undefined;
          },
          "Worktree creation completed without a final result.",
        )) as T;
      }
      if (method === WS_METHODS.projectsProvisionFromGitHub) {
        return (await this.runProgressStream<
          GitHubProjectProvisionProgressEvent,
          GitHubProjectProvisionResult
        >(
          method,
          params,
          scope,
          (event) => {
            this.emit(WS_CHANNELS.projectProvisionProgress, event);
            return event.kind === "completed" ? event.result : undefined;
          },
          "Project provisioning completed without a final result.",
        )) as T;
      }
      const payload = omitNullUserInputAnswers(
        method === ORCHESTRATION_WS_METHODS.dispatchCommand
          ? (params as { command: unknown }).command
          : (params ?? {}),
      );
      let capacityAttempts = 0;
      while (true) {
        try {
          const result = await scope.race(
            nativeRpcRequest<T>(method, payload, { timeoutMs: scope.hostTimeoutMs }),
          );
          this.noteHostResult();
          return result;
        } catch (error) {
          if (scope.interrupted()) throw error;
          if (isNativeTransportError(error)) {
            this.setState("closed");
            // The host lost its socket with the request in flight: the server may
            // have applied a turn start. Ask it for the durable verdict (upstream
            // `settleTurnDispatch`) instead of reporting the send as failed.
            const turn = uncertainTurnStart(method, payload);
            if (
              turn &&
              !this.disposed &&
              options?.signal?.aborted !== true &&
              this.compatibility?.capabilities.includes(WS_TURN_DISPATCH_SETTLEMENT_CAPABILITY)
            ) {
              const finishSettlement = trackWsTurnSettlement(turn.threadId);
              try {
                return (await this.settleTurnDispatch(turn, options?.signal)) as T;
              } finally {
                finishSettlement();
              }
            }
            throw error;
          }
          this.noteHostResult();
          // The server rejects a saturated unary call before its handler runs
          // and marks it retryable: honor that in place, like upstream.
          const retryDelayMs = getUnaryRpcCapacityRetryDelayMs(error, capacityAttempts);
          if (retryDelayMs === null) throw error;
          capacityAttempts += 1;
          await scope.race(delay(retryDelayMs));
        }
      }
    } catch (error) {
      // The interruption wins over whatever the host reports afterwards.
      throw scope.interrupted() ?? error;
    } finally {
      scope.cleanup();
    }
  }

  subscribe<C extends WsPushChannel>(
    channel: C,
    listener: PushListener<C>,
    options?: { readonly replayLatest?: boolean },
  ): () => void {
    let channelListeners = this.listeners.get(channel);
    if (!channelListeners) {
      channelListeners = new Set<(message: WsPush) => void>();
      this.listeners.set(channel, channelListeners);
      this.startChannelStream(channel);
    }

    const wrappedListener = (message: WsPush) => listener(message as WsPushMessage<C>);
    channelListeners.add(wrappedListener);

    if (options?.replayLatest) {
      const latest = this.latestPushByChannel.get(channel);
      if (latest) wrappedListener(latest);
    }

    return () => {
      channelListeners?.delete(wrappedListener);
      if (channelListeners?.size === 0) {
        this.listeners.delete(channel);
        this.stopChannelStream(channel);
      }
    };
  }

  subscribeProjectFileChange(
    input: ProjectWatchFileInput,
    listener: (event: ProjectFileChangeEvent) => void,
  ): () => void {
    const key = projectFileChangeStreamKey(input);
    let subscription = this.projectFileSubscriptions.get(key);
    const isNewSubscription = subscription === undefined;
    if (!subscription) {
      subscription = { input, listeners: new Set() };
      this.projectFileSubscriptions.set(key, subscription);
    }
    subscription.listeners.add(listener);
    const desiredSubscription = subscription;
    if (isNewSubscription && !isMainThread()) {
      // The capability check needs the host's negotiation, which the links seed.
      void this.ensureHostLinks()
        .then(() => this.startProjectFileChangeStream(key, desiredSubscription))
        .catch(() => undefined);
    }

    return () => {
      desiredSubscription.listeners.delete(listener);
      if (
        desiredSubscription.listeners.size > 0 ||
        this.projectFileSubscriptions.get(key) !== desiredSubscription
      ) {
        return;
      }
      this.projectFileSubscriptions.delete(key);
      void this.stopStream(key);
    };
  }

  getLatestPush<C extends WsPushChannel>(channel: C): WsPushMessage<C> | null {
    const latest = this.latestPushByChannel.get(channel);
    return latest ? (latest as WsPushMessage<C>) : null;
  }

  onStateChange(
    listener: (state: WsTransportState) => void,
    options?: { readonly replayCurrent?: boolean },
  ): () => void {
    this.stateListeners.add(listener);
    if (options?.replayCurrent) listener(this.state);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  getState(): WsTransportState {
    return this.state;
  }

  /** What the host negotiated for its socket; `null` until the host links report it. */
  getCompatibility(): WsBootstrapNegotiateResult | null {
    return this.compatibility;
  }

  onCompatibilityChange(
    listener: (compatibility: WsBootstrapNegotiateResult | null) => void,
    options?: { readonly replayCurrent?: boolean },
  ): () => void {
    this.compatibilityResultListeners.add(listener);
    if (options?.replayCurrent) listener(this.compatibility);
    return () => {
      this.compatibilityResultListeners.delete(listener);
    };
  }

  onCompatibilityIssue(
    listener: (issue: WsCompatibilityError | null) => void,
    options?: { readonly replayCurrent?: boolean },
  ): () => void {
    this.compatibilityListeners.add(listener);
    if (options?.replayCurrent) listener(null);
    return () => {
      this.compatibilityListeners.delete(listener);
    };
  }

  /** Upstream `settleTurnDispatch`: repeat until the server accepts or rejects the turn. */
  private async settleTurnDispatch(
    command: Extract<ClientOrchestrationCommand, { type: "thread.turn.start" }>,
    signal: AbortSignal | undefined,
  ): Promise<{ sequence: number }> {
    let attempt = 0;
    for (;;) {
      if (this.disposed) throw new Error("Transport disposed");
      if (signal?.aborted) throw signal.reason ?? new Error("Aborted");
      let result: OrchestrationSettleTurnDispatchResult;
      try {
        result = await this.request<OrchestrationSettleTurnDispatchResult>(
          ORCHESTRATION_WS_METHODS.settleTurnDispatch,
          { command },
          signal ? { signal } : undefined,
        );
      } catch (error) {
        if (
          this.disposed ||
          signal?.aborted ||
          (error instanceof WsTransportRequestInterruptedError &&
            (error.code === "WS_TURN_SETTLEMENT_UNAVAILABLE" ||
              error.code === "WS_REQUEST_ABORTED"))
        ) {
          throw error;
        }
        // Repeating settlement is safe: it reads or rejects the original identity.
        await delay(Math.max(500, Math.min(STREAM_RESTART_DELAY_MS * 2 ** attempt, 5_000)));
        attempt += 1;
        continue;
      }
      if (result.status === "accepted") return { sequence: result.sequence };
      throw new Error(result.message);
    }
  }

  /** Fires when the shell subscription exhausts its overflow retries. */
  onShellStreamFailure(listener: (failure: WsShellStreamFailure) => void): () => void {
    this.shellStreamFailureListeners.add(listener);
    return () => {
      this.shellStreamFailureListeners.delete(listener);
    };
  }

  /** Drops a project-agent subscription and cancels its stream. */
  async unsubscribeProjectAgentEvents(projectId: string): Promise<void> {
    this.projectAgentSubscriptions.delete(projectId);
    await this.stopStream(`${PROJECT_AGENT_STREAM_KEY_PREFIX}${projectId}`);
  }

  private startProjectAgentEventStream(projectId: string, params: unknown): void {
    if (this.projectAgentSubscriptions.get(projectId) !== params) return;
    this.startStream(
      `${PROJECT_AGENT_STREAM_KEY_PREFIX}${projectId}`,
      WS_METHODS.subscribeProjectAgentEvents,
      params,
      (event) => this.emit(WS_CHANNELS.projectAgentEvent, event as never),
      () => this.startProjectAgentEventStream(projectId, params),
    );
  }

  /** Fires when a per-thread stream dies with no retry left. */
  onThreadStreamFailure(listener: (failure: WsThreadStreamFailure) => void): () => void {
    this.threadStreamFailureListeners.add(listener);
    return () => {
      this.threadStreamFailureListeners.delete(listener);
    };
  }

  private emitThreadStreamFailure(failure: WsThreadStreamFailure): void {
    for (const listener of this.threadStreamFailureListeners) {
      try {
        listener(failure);
      } catch {
        // Listener errors must not break transport streams.
      }
    }
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.setState("disposed");
    for (const timer of this.streamRestartTimers.values()) clearTimeout(timer);
    this.streamRestartTimers.clear();
    this.streamAdmissionRetries.clear();
    this.projectFileWatchRetries.clear();
    this.projectFileSubscriptions.clear();
    this.projectAgentSubscriptions.clear();
    this.streamOverflowRetries.clear();
    this.threadStreamFailureListeners.clear();
    this.shellStreamFailureListeners.clear();
    // Channel, shell, thread and in-flight git streams alike.
    const keys = [...this.streams.keys()];
    await Promise.all(keys.map((key) => this.stopStream(key)));
    this.stopChannelStream(WS_CHANNELS.terminalEvent);
    const hostLinks = this.hostLinks;
    this.hostLinks = null;
    if (hostLinks) {
      await hostLinks.then((release) => release()).catch(() => undefined);
    }
  }

  // ── host links ──────────────────────────────────────────────────────────

  private ensureHostLinks(): Promise<() => void> {
    if (!this.hostLinks) {
      this.hostLinks = (async () => {
        const releaseState = await subscribeNativeTransportState((state) =>
          this.applyHostState(state),
        );
        const releaseItems = await subscribeNativeRpcStreamItems((streamId, item) => {
          // A stale generation's items (streams the host is still winding down
          // after a renderer reload) never reach this renderer's handlers.
          if (scopedStreamGeneration(streamId) !== this.generation) return;
          this.streamItemHandlers.get(streamId)?.(item);
        });
        // Generation handshake: the host cancels every scoped stream an earlier
        // renderer left behind and reports its current socket state, which a
        // renderer attaching to an already-connected host would otherwise miss.
        const releaseCompatibility = await subscribeNativeRpcCompatibility((compatibility) =>
          this.adoptCompatibility(compatibility),
        );
        const reset = await nativeRpcResetStreams();
        this.generation = reset.generation;
        if (reset.compatibility) this.adoptCompatibility(reset.compatibility);
        if (isHostTransportState(reset.transportState)) this.applyHostState(reset.transportState);
        return () => {
          releaseState();
          releaseItems();
          releaseCompatibility();
        };
      })();
    }
    return this.hostLinks;
  }

  /**
   * Upstream `adoptNegotiation`, fed by the host's negotiation instead of our
   * own. A new server instance may serve a different event journal, so replayed
   * push state, resume cursors and the per-thread versioned device/computer
   * caches are dropped; thread streams are then reopened, because one may
   * already have been requested with a cursor from the previous journal.
   */
  private adoptCompatibility(next: NativeRpcCompatibility): void {
    if (this.disposed) return;
    const identityChanged =
      this.lastServerInstanceId !== null && this.lastServerInstanceId !== next.serverInstanceId;
    this.lastServerInstanceId = next.serverInstanceId;
    if (identityChanged) {
      this.latestPushByChannel.clear();
      this.sequence = 0;
      resetThreadDetailResumeCursors();
      useDeviceStateStore.getState().clear();
      useComputerStateStore.getState().clear();
    }
    const previous = this.compatibility;
    const unchanged =
      previous !== null &&
      previous.serverInstanceId === next.serverInstanceId &&
      previous.protocolEpoch === next.protocolEpoch &&
      previous.negotiatedRevision === next.negotiatedRevision &&
      previous.serverBuild === next.serverBuild &&
      previous.capabilities.length === next.capabilities.length &&
      previous.capabilities.every((capability, index) => capability === next.capabilities[index]);
    if (!unchanged) {
      this.compatibility = { ...next, capabilities: [...next.capabilities] };
      for (const listener of this.compatibilityResultListeners) {
        try {
          listener(this.compatibility);
        } catch {
          // Listener errors must not break transport state transitions.
        }
      }
      // A file watch requested before the capability was known starts now.
      for (const [key, subscription] of this.projectFileSubscriptions) {
        this.startProjectFileChangeStream(key, subscription);
      }
    }
    if (identityChanged) {
      for (const threadId of [...this.threadSubscriptions.keys()]) {
        const desired = this.refreshThreadSubscriptionInput(threadId);
        if (desired !== undefined) {
          void this.startThreadStream(threadId, desired, { forceRestart: true });
        }
      }
    }
  }

  private applyHostState(state: RpcTransportState): void {
    if (state === "connected") this.everConnected = true;
    this.setState(mapHostTransportState(state, this.everConnected));
  }

  private noteHostResult(): void {
    this.everConnected = true;
    this.setState("open");
  }

  private setState(state: WsTransportState): void {
    if (this.disposed && state !== "disposed") return;
    if (this.state === state) return;
    this.state = state;
    for (const listener of this.stateListeners) {
      try {
        listener(state);
      } catch {
        // Listener errors must not break transport state transitions.
      }
    }
  }

  private emit<C extends WsPushChannel>(channel: C, data: WsPushMessage<C>["data"]): void {
    const message = {
      type: "push" as const,
      sequence: ++this.sequence,
      channel,
      data,
    } as WsPush;
    this.latestPushByChannel.set(channel, message);
    const listeners = this.listeners.get(channel);
    if (!listeners) return;
    for (const listener of listeners) {
      try {
        listener(message);
      } catch {
        // Listener errors must not break transport streams.
      }
    }
  }

  // ── streams ─────────────────────────────────────────────────────────────

  private startChannelStream(channel: WsPushChannel): void {
    if (isMainThread() || this.disposed) return;
    const restart = () => {
      if (this.listeners.has(channel)) this.startChannelStream(channel);
    };
    switch (channel) {
      case WS_CHANNELS.serverWelcome:
      case WS_CHANNELS.serverMaintenanceUpdated:
        this.startStream(
          "server.lifecycle",
          WS_METHODS.subscribeServerLifecycle,
          {},
          (event: ServerLifecycleStreamEvent) => {
            if (event.type === "welcome") {
              this.emit(WS_CHANNELS.serverWelcome, event.payload);
            } else if (event.type === "maintenance") {
              this.emit(WS_CHANNELS.serverMaintenanceUpdated, event);
            }
          },
          () => {
            if (
              this.listeners.has(WS_CHANNELS.serverWelcome) ||
              this.listeners.has(WS_CHANNELS.serverMaintenanceUpdated)
            ) {
              this.startChannelStream(WS_CHANNELS.serverWelcome);
            }
          },
        );
        return;
      case WS_CHANNELS.serverConfigUpdated:
        this.startStream(
          "server.config",
          WS_METHODS.subscribeServerConfig,
          {},
          (event: ServerConfigStreamEvent) => {
            if (event.type === "snapshot") {
              this.emit(WS_CHANNELS.serverConfigUpdated, {
                issues: event.config.issues,
                providers: event.config.providers,
              });
            } else if (event.type === "configUpdated") {
              this.emit(WS_CHANNELS.serverConfigUpdated, event.payload);
            }
          },
          restart,
        );
        return;
      case WS_CHANNELS.serverProviderStatusesUpdated:
        this.startStream(
          "server.providers",
          WS_METHODS.subscribeServerProviderStatuses,
          {},
          (payload) => this.emit(WS_CHANNELS.serverProviderStatusesUpdated, payload as never),
          restart,
        );
        return;
      case WS_CHANNELS.serverSettingsUpdated:
        this.startStream(
          "server.settings",
          WS_METHODS.subscribeServerSettings,
          {},
          (payload) => this.emit(WS_CHANNELS.serverSettingsUpdated, payload as never),
          restart,
        );
        return;
      case WS_CHANNELS.terminalEvent:
        // Transitional: the legacy relay stream already holds the per-socket
        // `terminal.events` lease for the Lynx terminal consumers; a second
        // stream would be rejected as a duplicate. Mirror its broadcast.
        this.legacyTerminalEvents ??= subscribeNativeTerminalEvents((event) =>
          this.emit(WS_CHANNELS.terminalEvent, event as never),
        );
        return;
      case WS_CHANNELS.projectDevServerEvent:
        this.startStream(
          "project.devServers",
          WS_METHODS.subscribeProjectDevServerEvents,
          {},
          (event) => this.emit(WS_CHANNELS.projectDevServerEvent, event as never),
          restart,
        );
        return;
      case WS_CHANNELS.automationEvent:
        this.startStream(
          "automation.events",
          WS_METHODS.subscribeAutomationEvents,
          {},
          (event) => this.emit(WS_CHANNELS.automationEvent, event as never),
          restart,
        );
        return;
      case WS_CHANNELS.serverKeepAwakeUpdated:
        this.startStream(
          "server.keep-awake",
          WS_METHODS.subscribeServerKeepAwake,
          {},
          (payload) => this.emit(WS_CHANNELS.serverKeepAwakeUpdated, payload as never),
          restart,
        );
        return;
      case WS_CHANNELS.todoEvent:
        this.startStream(
          "todo.events",
          WS_METHODS.subscribeTodoEvents,
          {},
          (event) => this.emit(WS_CHANNELS.todoEvent, event as never),
          restart,
        );
        return;
      case DEVICE_WS_CHANNELS.event:
        this.startStream(
          "device.events",
          DEVICE_WS_METHODS.subscribeEvents,
          {},
          (event) => this.emit(DEVICE_WS_CHANNELS.event, event as never),
          restart,
        );
        return;
      case COMPUTER_WS_CHANNELS.event:
        this.startStream(
          "computer.events",
          COMPUTER_WS_METHODS.subscribeEvents,
          {},
          (event) => this.emit(COMPUTER_WS_CHANNELS.event, event as never),
          restart,
        );
        return;
      case ORCHESTRATION_WS_CHANNELS.domainEvent:
        this.startStream(
          "orchestration.domain",
          WS_METHODS.subscribeOrchestrationDomainEvents,
          {},
          (event) => this.emit(ORCHESTRATION_WS_CHANNELS.domainEvent, event as never),
          restart,
        );
        return;
      default:
        // gitActionProgress, gitWorktreeSetupProgress, projectProvisionProgress,
        // shellEvent and threadEvent are fed by requests.
        return;
    }
  }

  private stopChannelStream(channel: WsPushChannel): void {
    if (channel === WS_CHANNELS.terminalEvent) {
      const release = this.legacyTerminalEvents;
      this.legacyTerminalEvents = null;
      void release?.then((unsubscribe) => unsubscribe()).catch(() => undefined);
      return;
    }
    const key =
      channel === WS_CHANNELS.serverWelcome || channel === WS_CHANNELS.serverMaintenanceUpdated
        ? this.listeners.has(WS_CHANNELS.serverWelcome) ||
          this.listeners.has(WS_CHANNELS.serverMaintenanceUpdated)
          ? null
          : "server.lifecycle"
        : channel === WS_CHANNELS.serverConfigUpdated
          ? "server.config"
          : channel === WS_CHANNELS.serverProviderStatusesUpdated
            ? "server.providers"
            : channel === WS_CHANNELS.serverSettingsUpdated
              ? "server.settings"
              : channel === WS_CHANNELS.projectDevServerEvent
                ? "project.devServers"
                : channel === WS_CHANNELS.automationEvent
                  ? "automation.events"
                  : channel === WS_CHANNELS.serverKeepAwakeUpdated
                    ? "server.keep-awake"
                    : channel === WS_CHANNELS.todoEvent
                      ? "todo.events"
                      : channel === DEVICE_WS_CHANNELS.event
                        ? "device.events"
                        : channel === COMPUTER_WS_CHANNELS.event
                          ? "computer.events"
                          : channel === ORCHESTRATION_WS_CHANNELS.domainEvent
                            ? "orchestration.domain"
                            : null;
    if (key) void this.stopStream(key);
  }

  private async startShellStream(forceRestart = false): Promise<void> {
    if (this.disposed || !this.shellSubscribed) return;
    if (forceRestart) {
      // An explicit resubscribe expects a fresh snapshot: the caller reset its
      // shell fence and buffers events until one arrives. A surviving stream
      // whose snapshot was already delivered would leave it buffering forever.
      await this.stopStream(SHELL_STREAM_KEY, { resetFailures: false });
      if (this.disposed || !this.shellSubscribed) return;
    }
    if (!this.streams.has(SHELL_STREAM_KEY)) this.shellSnapshotDelivered = false;
    this.startStream(
      SHELL_STREAM_KEY,
      ORCHESTRATION_WS_METHODS.subscribeShell,
      {},
      (event: OrchestrationShellStreamItem) => {
        if (event.kind === "snapshot") this.shellSnapshotDelivered = true;
        this.emit(ORCHESTRATION_WS_CHANNELS.shellEvent, event);
      },
      () => {
        if (this.shellSubscribed) void this.startShellStream();
      },
    );
  }

  /**
   * Upstream `refreshThreadSubscriptionInput`: a transport-managed restart must
   * not replay the input captured at subscribe time. A thread first subscribed
   * without a cursor would request full snapshots forever, and a cursor cleared
   * since then would be resent stale. Returns undefined once unsubscribed.
   */
  private refreshThreadSubscriptionInput(threadId: string): unknown {
    if (!this.threadSubscriptions.has(threadId)) return undefined;
    const existingInput = this.threadSubscriptions.get(threadId);
    const rebuiltInput: unknown = buildThreadSubscribeInput(ThreadId.makeUnsafe(threadId));
    const input = threadStreamInputsEqual(existingInput, rebuiltInput)
      ? existingInput
      : rebuiltInput;
    this.threadSubscriptions.set(threadId, input);
    return input;
  }

  private async startThreadStream(
    threadId: string,
    input: unknown,
    options: { readonly forceRestart?: boolean } = {},
  ): Promise<void> {
    const key = `${THREAD_STREAM_KEY_PREFIX}${threadId}`;
    if (this.disposed || this.threadSubscriptions.get(threadId) !== input) return;
    if (
      options.forceRestart !== true &&
      this.streams.has(key) &&
      this.activeThreadStreamInputs.get(key) === input
    ) {
      return;
    }
    // Retry budgets survive the stop: an explicit (re)subscription resets them
    // before it gets here, an automatic restart must keep its backoff growing.
    await this.stopStream(key, { resetFailures: false });
    if (this.disposed || this.threadSubscriptions.get(threadId) !== input) return;
    this.activeThreadStreamInputs.set(key, input);
    this.startStream(
      key,
      ORCHESTRATION_WS_METHODS.subscribeThread,
      input,
      (event) => this.emit(ORCHESTRATION_WS_CHANNELS.threadEvent, event as never),
      () => {
        const desired = this.refreshThreadSubscriptionInput(threadId);
        if (desired !== undefined) void this.startThreadStream(threadId, desired);
      },
    );
  }

  private startProjectFileChangeStream(
    key: string,
    subscription: ProjectFileChangeSubscription,
  ): void {
    if (
      this.disposed ||
      this.projectFileSubscriptions.get(key) !== subscription ||
      !this.compatibility?.capabilities.includes(WS_PROJECT_FILE_WATCH_CAPABILITY)
    ) {
      return;
    }
    this.startStream<ProjectFileChangeEvent>(
      key,
      WS_METHODS.projectsSubscribeFileChange,
      subscription.input,
      (event) => {
        for (const listener of subscription.listeners) {
          try {
            listener(event);
          } catch {
            // One panel listener must not prevent another from revalidating.
          }
        }
      },
      () => this.startProjectFileChangeStream(key, subscription),
    );
  }

  /**
   * Registers a request-scoped host stream under `key`. The stream id is
   * minted only once the host links (and the renderer generation) exist; a
   * stop or dispose before that point never opens anything on the host.
   */
  private openScopedStream<T>(
    key: string,
    tag: string,
    payload: unknown,
    listener: (item: T) => void,
  ): ActiveStream {
    const { promise: opened, resolve: resolveOpened } = deferred<boolean>();
    const entry: ActiveStream = {
      streamId: null,
      opened,
      stopped: false,
      settled: this.ensureHostLinks().then(
        () => {
          if (entry.stopped || this.disposed || this.generation === null) {
            resolveOpened(false);
            return;
          }
          const streamId = scopedStreamId(this.generation, key, ++nextStreamSequence);
          entry.streamId = streamId;
          this.streamItemHandlers.set(streamId, (item) => {
            this.streamFailures.delete(key);
            this.streamAdmissionRetries.delete(key);
            this.noteHostResult();
            listener(item as T);
          });
          const pending = nativeRpcOpenStream(streamId, tag, payload);
          resolveOpened(true);
          return pending;
        },
        (error: unknown) => {
          resolveOpened(false);
          throw error;
        },
      ),
    };
    this.streams.set(key, entry);
    return entry;
  }

  private startStream<T>(
    key: string,
    tag: string,
    payload: unknown,
    listener: (item: T) => void,
    restart: () => void,
  ): void {
    if (isMainThread() || this.disposed || this.streams.has(key)) return;
    this.clearRestartTimer(key);
    const entry = this.openScopedStream(key, tag, payload, listener);
    const startedAt = Date.now();
    void entry.settled
      .then(
        () => null,
        (error: unknown) => ({ error }),
      )
      .then((failed) => {
        if (entry.streamId !== null) this.streamItemHandlers.delete(entry.streamId);
        if (this.streams.get(key) !== entry) return; // replaced or stopped
        this.streams.delete(key);
        this.activeThreadStreamInputs.delete(key);
        if (this.disposed) return;
        this.scheduleRestartAfterSettle(key, failed, Date.now() - startedAt, restart);
      });
  }

  /**
   * Upstream `startStream` exit policy. A typed admission failure is retried in
   * place within its budget; an exhausted one is terminal for the stream (and
   * reported for thread streams), except server-diagnosed snapshot faults,
   * which keep a slow retry. Anything else (the host lost its socket, an
   * untyped failure, a stream the server ended) restarts with backoff: the
   * host owns reconnecting, so there is no socket for this class to reopen.
   */
  private scheduleRestartAfterSettle(
    key: string,
    failed: { readonly error: unknown } | null,
    lifetimeMs: number,
    restart: () => void,
  ): void {
    const scheduleRestart = (delayMs: number) => {
      this.clearRestartTimer(key);
      this.streamRestartTimers.set(
        key,
        setTimeout(() => {
          this.streamRestartTimers.delete(key);
          if (!this.disposed && !this.streams.has(key)) restart();
        }, delayMs),
      );
    };
    const scheduleBackoffRestart = (endedCleanly: boolean) => {
      const failures = endedCleanly ? 0 : (this.streamFailures.get(key) ?? 0) + 1;
      this.streamFailures.set(key, failures);
      scheduleRestart(
        Math.min(
          STREAM_RESTART_DELAY_MS * 2 ** Math.max(0, failures - 1),
          STREAM_RESTART_MAX_DELAY_MS,
        ),
      );
    };
    if (failed === null) {
      scheduleBackoffRestart(true);
      return;
    }
    if (isNativeTransportError(failed.error)) {
      this.setState("closed");
      scheduleBackoffRestart(false);
      return;
    }
    const failure = failureDetailsOf(failed.error);
    const attempts = this.streamAdmissionRetries.get(key) ?? {
      capacity: 0,
      duplicate: 0,
      "thread-bootstrap": 0,
      resnapshot: 0,
    };
    const admissionRetry = resolveStreamAdmissionRetry(failure, attempts);
    if (admissionRetry !== null) {
      this.streamAdmissionRetries.set(key, {
        ...attempts,
        [admissionRetry.kind]: admissionRetry.attempt,
      });
      if (admissionRetry.kind === "resnapshot") {
        // The server's snapshot trails its journal beyond the replay limit. A
        // resume cursor would ask for the same gap again; dropping it makes
        // the restart request a full snapshot.
        const threadId = threadIdFromStreamKey(key);
        if (threadId !== null) clearThreadDetailResumeCursor(ThreadId.makeUnsafe(threadId));
      }
      scheduleRestart(
        Math.min(admissionRetry.delayMs * admissionRetry.attempt, MAX_STREAM_CAPACITY_RETRY_MS),
      );
      return;
    }
    const previousFileWatchAttempts =
      lifetimeMs >= STABLE_STREAM_LIFETIME_MS ? 0 : (this.projectFileWatchRetries.get(key) ?? 0);
    const fileWatchRetryDelayMs = getProjectFileWatchRetryDelayMs(
      failure,
      previousFileWatchAttempts,
    );
    if (fileWatchRetryDelayMs !== null) {
      this.projectFileWatchRetries.set(key, previousFileWatchAttempts + 1);
      scheduleRestart(fileWatchRetryDelayMs);
      return;
    }
    if (failure?.code === ORCHESTRATION_STREAM_OVERFLOW_CODE) {
      // A snapshot alone does not prove recovery, so only a stream that stayed
      // up resets the budget; the last applied cursor is kept.
      const attempt =
        lifetimeMs >= STABLE_STREAM_LIFETIME_MS ? 0 : (this.streamOverflowRetries.get(key) ?? 0);
      if (attempt < MAX_STREAM_OVERFLOW_RETRIES) {
        this.streamOverflowRetries.set(key, attempt + 1);
        scheduleRestart(getStreamOverflowRetryDelayMs(attempt));
        return;
      }
    }
    if (failure?.code == null || !STREAM_ADMISSION_ERROR_CODES.has(failure.code)) {
      scheduleBackoffRestart(false);
      return;
    }
    const error = failed.error instanceof Error ? failed.error : new Error(String(failed.error));
    console.warn("Synara RPC stream failed", key, error.message);
    const threadId = threadIdFromStreamKey(key);
    if (threadId !== null && this.threadSubscriptions.has(threadId)) {
      this.emitThreadStreamFailure({ threadId, code: failure.code, error });
    }
    if (key === SHELL_STREAM_KEY && failure.code === ORCHESTRATION_STREAM_OVERFLOW_CODE) {
      for (const listener of this.shellStreamFailureListeners) {
        try {
          listener({ code: failure.code, error });
        } catch {
          // Listener errors must not break transport streams.
        }
      }
    }
    if (SNAPSHOT_FAULT_ERROR_CODES.has(failure.code)) scheduleRestart(SNAPSHOT_FAULT_RETRY_MS);
  }

  /** An explicit (re)subscription starts its retry budgets over. */
  private resetStreamRetries(key: string): void {
    this.clearRestartTimer(key);
    this.streamFailures.delete(key);
    this.streamAdmissionRetries.delete(key);
    this.projectFileWatchRetries.delete(key);
    this.streamOverflowRetries.delete(key);
  }

  private clearRestartTimer(key: string): void {
    const timer = this.streamRestartTimers.get(key);
    if (timer === undefined) return;
    clearTimeout(timer);
    this.streamRestartTimers.delete(key);
  }

  private async stopStream(
    key: string,
    options: { readonly resetFailures?: boolean } = {},
  ): Promise<void> {
    this.clearRestartTimer(key);
    if (options.resetFailures !== false) {
      this.streamFailures.delete(key);
      this.streamAdmissionRetries.delete(key);
      this.projectFileWatchRetries.delete(key);
    }
    this.activeThreadStreamInputs.delete(key);
    const entry = this.streams.get(key);
    if (!entry) return;
    this.streams.delete(key);
    entry.stopped = true;
    // Cancel only once the open request is on the bridge, so the host never
    // receives the cancel first and then starts an orphaned stream.
    if ((await entry.opened) && entry.streamId !== null) {
      this.streamItemHandlers.delete(entry.streamId);
      await nativeRpcCancelStream(entry.streamId).catch(() => false);
    }
    await entry.settled.catch(() => undefined);
  }

  /**
   * One-shot progress stream (git stacked action, worktree setup, GitHub
   * provisioning), registered like every other scoped stream so dispose and
   * request interruption cancel it on the host; `timeoutMs`/`signal` apply
   * through the caller's abort scope (upstream passes `timeoutMs: null`).
   * `onEvent` publishes the progress push and returns the final result once
   * the stream carries it.
   */
  /**
   * Upstream `runRecoverableGitAction`. Against a server that advertises recovery
   * the action is started as `recoverable`, so it outlives this observer; after a
   * lost socket the same action id is reattached with `resume`, which the server
   * never treats as a new run. Without the capability the action is request-owned
   * and a failure is reported as it is: re-running a mutation blindly is not safe.
   */
  private async runRecoverableGitAction(
    params: unknown,
    scope: RequestAbortScope,
  ): Promise<GitRunStackedActionResult> {
    const serverRecovers = () =>
      this.compatibility?.capabilities.includes(WS_GIT_ACTION_RECOVERY_CAPABILITY) === true;
    const canRecover = serverRecovers();
    const command = canRecover ? { ...(params as object), recoverable: true } : params;
    let resume = false;
    let attempt = 0;
    for (;;) {
      if (this.disposed) throw new Error("Transport disposed");
      try {
        // An older server would ignore `resume` and execute the mutation again.
        if (resume && !serverRecovers()) {
          throw new Error(
            "This server cannot recover the Git action. Check the repository status before trying again.",
          );
        }
        return await this.runProgressStream<GitActionProgressEvent, GitRunStackedActionResult>(
          WS_METHODS.gitRunStackedAction,
          resume ? { ...(command as object), resume: true } : command,
          scope,
          (event) => {
            this.emit(WS_CHANNELS.gitActionProgress, event);
            return event.kind === "action_finished"
              ? (event as Extract<GitActionProgressEvent, { kind: "action_finished" }>).result
              : undefined;
          },
          "Git action stream completed without a final result.",
          { keepReceivedResult: true },
        );
      } catch (error) {
        if (!canRecover || scope.interrupted() || this.disposed || !isNativeTransportError(error)) {
          throw error;
        }
        resume = true;
        await scope.race(
          delay(Math.max(500, Math.min(STREAM_RESTART_DELAY_MS * 2 ** attempt, 5_000))),
        );
        attempt += 1;
      }
    }
  }

  private async runProgressStream<Event, Result>(
    tag: string,
    params: unknown,
    scope: RequestAbortScope,
    onEvent: (event: Event) => Result | undefined,
    missingResultMessage: string,
    // A final result that already arrived stands even if the stream then fails
    // (upstream `runGitActionStream`): the mutation finished on the server.
    options?: { readonly keepReceivedResult?: boolean },
  ): Promise<Result> {
    if (isMainThread()) throw new Error(`${tag} runs on the background thread.`);
    let result: Result | undefined;
    const key = `${tag}#${++nextStreamSequence}`;
    const entry = this.openScopedStream<Event>(key, tag, params, (event) => {
      const final = onEvent(event);
      if (final !== undefined) result = final;
    });
    try {
      await scope.race(entry.settled);
      if (this.disposed) throw new Error("Transport disposed");
      this.noteHostResult();
    } catch (error) {
      if (this.streams.get(key) === entry) await this.stopStream(key);
      if (!scope.interrupted() && isNativeTransportError(error)) this.setState("closed");
      if (!(options?.keepReceivedResult === true && result !== undefined)) throw error;
    } finally {
      if (this.streams.get(key) === entry) this.streams.delete(key);
      if (entry.streamId !== null) this.streamItemHandlers.delete(entry.streamId);
    }
    if (result === undefined) throw new Error(missingResultMessage);
    return result;
  }
}
